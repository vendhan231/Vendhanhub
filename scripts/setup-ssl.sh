#!/bin/bash

# SSL Certificate Setup Script for Employee Management System
# This script helps configure SSL certificates for HTTPS

set -e

echo "🔒 Setting up SSL Certificates"
echo "============================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local response

    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

# Check if running as root (needed for certbot)
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        echo "⚠️  Running as root - this is not recommended for security"
        echo "   Consider using a non-root user with sudo access"
    fi
}

# Install certbot
install_certbot() {
    echo ""
    echo "📦 Step 1: Installing Certbot"
    echo "----------------------------"

    if command -v certbot &> /dev/null; then
        echo "✅ Certbot is already installed"
        return
    fi

    # Detect OS and install certbot
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        echo "📦 Installing Certbot for Debian/Ubuntu..."
        sudo apt-get update
        sudo apt-get install -y certbot
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        echo "📦 Installing Certbot for CentOS/RHEL..."
        sudo yum install -y certbot
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        echo "📦 Installing Certbot for Arch Linux..."
        sudo pacman -S certbot
    else
        echo "❌ Unsupported OS. Please install certbot manually:"
        echo "   https://certbot.eff.org/instructions"
        exit 1
    fi

    echo "✅ Certbot installed successfully"
}

# Setup SSL with Let's Encrypt
setup_letsencrypt() {
    echo ""
    echo "🔐 Step 2: Let's Encrypt Certificate Setup"
    echo "-----------------------------------------"

    DOMAIN=$(prompt_with_default "Enter your domain name" "")
    if [ -z "$DOMAIN" ]; then
        echo "❌ Domain name is required"
        exit 1
    fi

    EMAIL=$(prompt_with_default "Enter your email address" "")

    echo "🔐 Obtaining SSL certificate for: $DOMAIN"

    # Stop nginx if running (to free port 80)
    if command -v docker-compose &> /dev/null && docker-compose ps | grep -q "nginx"; then
        echo "⏹️  Stopping nginx container..."
        docker-compose stop nginx
    fi

    # Obtain certificate
    if [ -n "$EMAIL" ]; then
        sudo certbot certonly --standalone -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    else
        sudo certbot certonly --standalone -d "$DOMAIN" --register-unsafely-without-email --agree-tos --non-interactive
    fi

    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate obtained successfully"
    else
        echo "❌ Failed to obtain SSL certificate"
        exit 1
    fi

    # Set proper permissions
    sudo chmod 755 /etc/letsencrypt/archive
    sudo chmod 755 "/etc/letsencrypt/archive/$DOMAIN"
    sudo chmod 644 "/etc/letsencrypt/archive/$DOMAIN"/*

    # Create ssl directory and copy certificates
    mkdir -p ssl
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/

    # Set permissions for Docker
    sudo chmod 644 ssl/fullchain.pem
    sudo chmod 600 ssl/privkey.pem

    echo "✅ SSL certificates copied to ./ssl/ directory"
}

# Setup self-signed certificate (for development/testing)
setup_self_signed() {
    echo ""
    echo "🔐 Step 3: Self-Signed Certificate Setup (Development)"
    echo "----------------------------------------------------"

    DOMAIN=$(prompt_with_default "Enter domain name for certificate" "localhost")

    mkdir -p ssl

    # Generate private key
    openssl genrsa -out ssl/privkey.pem 2048

    # Generate certificate
    openssl req -new -x509 -key ssl/privkey.pem -out ssl/fullchain.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

    # Set permissions
    chmod 600 ssl/privkey.pem
    chmod 644 ssl/fullchain.pem

    echo "✅ Self-signed certificate created"
    echo "⚠️  Note: Self-signed certificates will show security warnings in browsers"
    echo "   Use Let's Encrypt certificates for production"
}

# Update nginx configuration
update_nginx_config() {
    echo ""
    echo "⚙️  Step 4: Updating Nginx Configuration"
    echo "--------------------------------------"

    if [ ! -f "nginx.conf" ]; then
        echo "❌ nginx.conf not found. Please ensure you're in the project root."
        exit 1
    fi

    # Enable SSL in nginx.conf
    sed -i 's/# return 301 https:/return 301 https:/g' nginx.conf
    sed -i 's/# server {/server {/g' nginx.conf
    sed -i 's/#     listen 443/#     listen 443/g' nginx.conf

    echo "✅ Nginx configuration updated for SSL"
}

# Setup auto-renewal
setup_auto_renewal() {
    echo ""
    echo "🔄 Step 5: Setting up Auto-Renewal"
    echo "---------------------------------"

    # Create renewal script
    cat > scripts/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script

echo "🔄 Renewing SSL certificates..."

# Stop nginx to free port 80
docker-compose stop nginx

# Renew certificates
certbot renew

# Copy renewed certificates
DOMAIN=$(grep -oP 'server_name \K[^;]+' nginx.conf | head -1)
if [ -n "$DOMAIN" ]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ssl/
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ssl/
fi

# Restart services
docker-compose start nginx

echo "✅ SSL certificates renewed"
EOF

    chmod +x scripts/renew-ssl.sh

    # Add to crontab for auto-renewal (runs twice daily)
    RENEWAL_CRON="0 12,0 * * * $(pwd)/scripts/renew-ssl.sh"

    echo "📋 Add this to crontab for auto-renewal (crontab -e):"
    echo "$RENEWAL_CRON"
    echo ""

    # Optional: Add to crontab automatically
    AUTO_CRON=$(prompt_with_default "Add auto-renewal to crontab automatically? (y/n)" "n")
    if [ "$AUTO_CRON" = "y" ]; then
        (crontab -l 2>/dev/null; echo "$RENEWAL_CRON") | crontab -
        echo "✅ Auto-renewal added to crontab"
    fi
}

# Setup Docker SSL proxy (alternative approach)
setup_docker_ssl() {
    echo ""
    echo "🐳 Step 6: Docker SSL Proxy Setup (Alternative)"
    echo "----------------------------------------------"

    USE_DOCKER_SSL=$(prompt_with_default "Set up Docker SSL proxy with traefik? (y/n)" "n")
    if [ "$USE_DOCKER_SSL" = "y" ]; then
        cat > docker-compose.ssl.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.5
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=YOUR_EMAIL@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - web
    restart: unless-stopped

volumes:
  traefik_letsencrypt:

networks:
  web:
    external: true
EOF

        # Update main docker-compose.yml to work with traefik
        sed -i 's/ports:/# ports:/g' docker-compose.yml
        sed -i 's/- "3000:3000"/# - "3000:3000"/g' docker-compose.yml
        sed -i 's/- "3001:3001"/# - "3001:3001"/g' docker-compose.yml

        # Add traefik labels to services
        cat >> docker-compose.yml << 'EOF'

    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`YOUR_DOMAIN`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"
    networks:
      - app-network
      - web

  backend:
    # ... existing backend config ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.YOUR_DOMAIN`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"
    networks:
      - app-network
      - web
EOF

        echo "✅ Traefik SSL proxy configured"
        echo "📝 Remember to:"
        echo "   1. Create external 'web' network: docker network create web"
        echo "   2. Update YOUR_DOMAIN and YOUR_EMAIL in docker-compose.ssl.yml"
        echo "   3. Run: docker-compose -f docker-compose.ssl.yml up -d"
    fi
}

# Verify SSL setup
verify_ssl() {
    echo ""
    echo "🔍 Step 7: Verifying SSL Setup"
    echo "------------------------------"

    if [ -f "ssl/fullchain.pem" ] && [ -f "ssl/privkey.pem" ]; then
        echo "✅ SSL certificate files found"

        # Check certificate validity
        if command -v openssl &> /dev/null; then
            echo "📋 Certificate information:"
            openssl x509 -in ssl/fullchain.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
        fi

        # Test nginx configuration
        if command -v nginx &> /dev/null; then
            echo "🔍 Testing nginx configuration..."
            nginx -t
            if [ $? -eq 0 ]; then
                echo "✅ Nginx configuration is valid"
            else
                echo "❌ Nginx configuration has errors"
            fi
        fi
    else
        echo "❌ SSL certificate files not found"
        exit 1
    fi
}

# Main execution
main() {
    check_permissions

    CERT_TYPE=$(prompt_with_default "Certificate type (letsencrypt/selfsigned)" "letsencrypt")

    case $CERT_TYPE in
        letsencrypt)
            install_certbot
            setup_letsencrypt
            ;;
        selfsigned)
            setup_self_signed
            ;;
        *)
            echo "❌ Invalid certificate type"
            exit 1
            ;;
    esac

    update_nginx_config
    setup_auto_renewal
    setup_docker_ssl
    verify_ssl

    echo ""
    echo "🎉 SSL Setup Complete!"
    echo "====================="
    echo ""
    echo "📋 Summary:"
    echo "- Certificate Type: $CERT_TYPE"
    echo "- Certificate Location: ./ssl/"
    echo "- Nginx Config: Updated"
    echo "- Auto-renewal: Configured"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Start your services: docker-compose up -d"
    echo "2. Test HTTPS: https://$DOMAIN"
    echo "3. Check certificate: https://www.ssllabs.com/ssltest/"
    echo ""
    echo "🔒 Security Notes:"
    echo "- Keep private keys secure and never commit them"
    echo "- Regularly update your SSL certificates"
    echo "- Monitor certificate expiration dates"
}

# Run main function
main "$@"