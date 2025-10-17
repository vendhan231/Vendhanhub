#!/bin/bash

# Automated Backup Script for Employee Management System
# This script sets up automated backups for database and files

set -e

echo "💾 Setting up Automated Backups"
echo "==============================="

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

# Setup backup directories
setup_backup_dirs() {
    echo "📁 Step 1: Creating Backup Directories"
    echo "-------------------------------------"

    BACKUP_ROOT="./backups"
    DB_BACKUP_DIR="$BACKUP_ROOT/database"
    FILE_BACKUP_DIR="$BACKUP_ROOT/files"
    CONFIG_BACKUP_DIR="$BACKUP_ROOT/config"

    mkdir -p "$DB_BACKUP_DIR" "$FILE_BACKUP_DIR" "$CONFIG_BACKUP_DIR"

    echo "✅ Backup directories created:"
    echo "   - $DB_BACKUP_DIR"
    echo "   - $FILE_BACKUP_DIR"
    echo "   - $CONFIG_BACKUP_DIR"
}

# Setup database backup
setup_database_backup() {
    echo ""
    echo "🗄️  Step 2: Database Backup Configuration"
    echo "----------------------------------------"

    DB_TYPE=$(prompt_with_default "Database type (postgresql/sqlite)" "postgresql")

    if [ "$DB_TYPE" = "postgresql" ]; then
        # PostgreSQL backup script
        cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

# PostgreSQL Database Backup Script

BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "🗄️  Creating PostgreSQL database backup..."

# Create backup using pg_dump
docker-compose exec -T db pg_dump -U postgres employee_db > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "✅ Database backup created: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
echo "🧹 Cleaned up backups older than 30 days"

# Optional: Upload to cloud storage
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "${BACKUP_FILE}.gz" "s3://$S3_BUCKET/backups/database/"
fi

echo "✅ Database backup complete"
EOF

    else
        # SQLite backup script
        cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

# SQLite Database Backup Script

BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.db"

echo "🗄️  Creating SQLite database backup..."

# Copy SQLite database file
cp "employee-management-billing-backend/prisma/dev.db" "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "✅ Database backup created: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "db_backup_*.db.gz" -mtime +30 -delete
echo "🧹 Cleaned up backups older than 30 days"

# Optional: Upload to cloud storage
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "${BACKUP_FILE}.gz" "s3://$S3_BUCKET/backups/database/"
fi

echo "✅ Database backup complete"
EOF
    fi

    chmod +x scripts/backup-database.sh
    echo "✅ Database backup script created"
}

# Setup file backup
setup_file_backup() {
    echo ""
    echo "📁 Step 3: File Backup Configuration"
    echo "-----------------------------------"

    cat > scripts/backup-files.sh << 'EOF'
#!/bin/bash

# File System Backup Script

BACKUP_DIR="./backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz"

echo "📁 Creating file system backup..."

# Create compressed archive of uploads directory
tar -czf "$BACKUP_FILE" -C . uploads/ 2>/dev/null || true

echo "✅ File backup created: $BACKUP_FILE"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -mtime +30 -delete
echo "🧹 Cleaned up file backups older than 30 days"

# Optional: Upload to cloud storage
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/files/"
fi

echo "✅ File backup complete"
EOF

    chmod +x scripts/backup-files.sh
    echo "✅ File backup script created"
}

# Setup configuration backup
setup_config_backup() {
    echo ""
    echo "⚙️  Step 4: Configuration Backup Configuration"
    echo "---------------------------------------------"

    cat > scripts/backup-config.sh << 'EOF'
#!/bin/bash

# Configuration Backup Script

BACKUP_DIR="./backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"

echo "⚙️  Creating configuration backup..."

# Create list of config files to backup
CONFIG_FILES=(
    ".env"
    ".env.production"
    "docker-compose.yml"
    "docker-compose.override.yml"
    "nginx.conf"
    "employee-management-billing-backend/.env"
    "employee-management-billing-backend/.env.production"
    "prometheus.yml"
    "alertmanager.yml"
)

# Create temporary directory for config files
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/config"

# Copy config files
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$TEMP_DIR/config/"
    fi
done

# Create compressed archive
tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" config/

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Configuration backup created: $BACKUP_FILE"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -mtime +30 -delete
echo "🧹 Cleaned up config backups older than 30 days"

# Optional: Upload to cloud storage
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/config/"
fi

echo "✅ Configuration backup complete"
EOF

    chmod +x scripts/backup-config.sh
    echo "✅ Configuration backup script created"
}

# Setup cloud storage (optional)
setup_cloud_storage() {
    echo ""
    echo "☁️  Step 5: Cloud Storage Setup (Optional)"
    echo "-----------------------------------------"

    USE_CLOUD=$(prompt_with_default "Set up cloud storage for backups? (y/n)" "n")
    if [ "$USE_CLOUD" = "y" ]; then
        CLOUD_PROVIDER=$(prompt_with_default "Cloud provider (aws/gcp/azure)" "aws")

        case $CLOUD_PROVIDER in
            aws)
                echo "AWS S3 Setup:"
                echo "1. Install AWS CLI: pip install awscli"
                echo "2. Configure AWS: aws configure"
                read -p "Enter S3 bucket name: " S3_BUCKET

                # Update backup scripts with S3 upload
                sed -i "s/\$S3_BUCKET/$S3_BUCKET/g" scripts/backup-*.sh

                echo "✅ AWS S3 configured for bucket: $S3_BUCKET"
                ;;
            gcp)
                echo "Google Cloud Storage Setup:"
                echo "1. Install gsutil"
                echo "2. Configure authentication: gcloud auth login"
                read -p "Enter GCS bucket name: " GCS_BUCKET

                # Update backup scripts with GCS upload
                sed -i 's|aws s3 cp|gsutil cp|g' scripts/backup-*.sh
                sed -i "s|s3://\$S3_BUCKET|gs://$GCS_BUCKET|g" scripts/backup-*.sh

                echo "✅ Google Cloud Storage configured for bucket: $GCS_BUCKET"
                ;;
            azure)
                echo "Azure Blob Storage Setup:"
                echo "1. Install Azure CLI: pip install azure-cli"
                echo "2. Login: az login"
                read -p "Enter storage account name: " AZURE_ACCOUNT
                read -p "Enter container name: " AZURE_CONTAINER

                # Update backup scripts with Azure upload
                sed -i 's|aws s3 cp|az storage blob upload|g' scripts/backup-*.sh
                sed -i "s|s3://\$S3_BUCKET|--account-name $AZURE_ACCOUNT --container-name $AZURE_CONTAINER --name|g" scripts/backup-*.sh

                echo "✅ Azure Blob Storage configured"
                ;;
        esac
    fi
}

# Setup cron jobs
setup_cron_jobs() {
    echo ""
    echo "⏰ Step 6: Automated Backup Scheduling"
    echo "-------------------------------------"

    echo "Setting up cron jobs for automated backups..."
    echo ""

    # Database backup - daily at 2 AM
    DB_CRON="0 2 * * * $(pwd)/scripts/backup-database.sh"

    # File backup - daily at 3 AM
    FILE_CRON="0 3 * * * $(pwd)/scripts/backup-files.sh"

    # Config backup - weekly on Sundays at 4 AM
    CONFIG_CRON="0 4 * * 0 $(pwd)/scripts/backup-config.sh"

    echo "📋 Cron job entries to add (using 'crontab -e'):"
    echo ""
    echo "# Database backup - daily at 2 AM"
    echo "$DB_CRON"
    echo ""
    echo "# File backup - daily at 3 AM"
    echo "$FILE_CRON"
    echo ""
    echo "# Configuration backup - weekly on Sundays at 4 AM"
    echo "$CONFIG_CRON"
    echo ""

    # Optional: Add to user's crontab automatically
    AUTO_CRON=$(prompt_with_default "Add these cron jobs automatically? (y/n)" "n")
    if [ "$AUTO_CRON" = "y" ]; then
        (crontab -l 2>/dev/null; echo "$DB_CRON") | crontab -
        (crontab -l 2>/dev/null; echo "$FILE_CRON") | crontab -
        (crontab -l 2>/dev/null; echo "$CONFIG_CRON") | crontab -
        echo "✅ Cron jobs added automatically"
    else
        echo "📝 Please add these lines to your crontab manually using 'crontab -e'"
    fi
}

# Create backup verification script
create_verification_script() {
    echo ""
    echo "🔍 Step 7: Backup Verification"
    echo "------------------------------"

    cat > scripts/verify-backups.sh << 'EOF'
#!/bin/bash

# Backup Verification Script

BACKUP_DIR="./backups"
LOG_FILE="$BACKUP_DIR/verification_$(date +%Y%m%d).log"

echo "🔍 Verifying backups..." | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

# Check database backups
echo "🗄️  Checking database backups..." | tee -a "$LOG_FILE"
DB_COUNT=$(find "$BACKUP_DIR/database" -name "*.gz" -mtime -1 2>/dev/null | wc -l)
if [ "$DB_COUNT" -gt 0 ]; then
    echo "✅ Database backup found (last 24h): $DB_COUNT file(s)" | tee -a "$LOG_FILE"
    ls -la "$BACKUP_DIR/database"/*.gz | head -5 | tee -a "$LOG_FILE"
else
    echo "❌ No recent database backup found!" | tee -a "$LOG_FILE"
fi

# Check file backups
echo "" | tee -a "$LOG_FILE"
echo "📁 Checking file backups..." | tee -a "$LOG_FILE"
FILE_COUNT=$(find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime -1 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt 0 ]; then
    echo "✅ File backup found (last 24h): $FILE_COUNT file(s)" | tee -a "$LOG_FILE"
    ls -la "$BACKUP_DIR/files"/*.tar.gz | head -5 | tee -a "$LOG_FILE"
else
    echo "❌ No recent file backup found!" | tee -a "$LOG_FILE"
fi

# Check configuration backups
echo "" | tee -a "$LOG_FILE"
echo "⚙️  Checking configuration backups..." | tee -a "$LOG_FILE"
CONFIG_COUNT=$(find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime -7 2>/dev/null | wc -l)
if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo "✅ Configuration backup found (last 7 days): $CONFIG_COUNT file(s)" | tee -a "$LOG_FILE"
    ls -la "$BACKUP_DIR/config"/*.tar.gz | head -5 | tee -a "$LOG_FILE"
else
    echo "❌ No recent configuration backup found!" | tee -a "$LOG_FILE"
fi

# Check disk space
echo "" | tee -a "$LOG_FILE"
echo "💾 Checking disk space..." | tee -a "$LOG_FILE"
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "📊 Total backup size: $BACKUP_SIZE" | tee -a "$LOG_FILE"

DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
echo "💽 Disk usage: $DISK_USAGE" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "✅ Backup verification complete" | tee -a "$LOG_FILE"
echo "📄 Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
EOF

    chmod +x scripts/verify-backups.sh
    echo "✅ Backup verification script created"
}

# Create restore scripts
create_restore_scripts() {
    echo ""
    echo "🔄 Step 8: Restore Scripts"
    echo "-------------------------"

    # Database restore script
    cat > scripts/restore-database.sh << 'EOF'
#!/bin/bash

# Database Restore Script

BACKUP_DIR="./backups/database"

echo "🔄 Database Restore Script"
echo "=========================="
echo ""
echo "⚠️  WARNING: This will overwrite your current database!"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# List available backups
echo "📋 Available database backups:"
ls -la "$BACKUP_DIR"/*.gz 2>/dev/null || echo "No backups found"

echo ""
read -p "Enter backup filename to restore: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Decompress and restore
if [[ $BACKUP_FILE == *.sql.gz ]]; then
    # PostgreSQL restore
    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | docker-compose exec -T db psql -U postgres -d employee_db
elif [[ $BACKUP_FILE == *.db.gz ]]; then
    # SQLite restore
    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > "employee-management-billing-backend/prisma/dev.db"
fi

echo "✅ Database restore complete"
EOF

    # File restore script
    cat > scripts/restore-files.sh << 'EOF'
#!/bin/bash

# File Restore Script

BACKUP_DIR="./backups/files"

echo "🔄 File Restore Script"
echo "======================"
echo ""
echo "⚠️  WARNING: This will overwrite your current files!"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# List available backups
echo "📋 Available file backups:"
ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"

echo ""
read -p "Enter backup filename to restore: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring files from: $BACKUP_FILE"

# Extract backup
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C .

echo "✅ File restore complete"
EOF

    chmod +x scripts/restore-database.sh scripts/restore-files.sh
    echo "✅ Restore scripts created"
}

# Main execution
main() {
    setup_backup_dirs
    setup_database_backup
    setup_file_backup
    setup_config_backup
    setup_cloud_storage
    setup_cron_jobs
    create_verification_script
    create_restore_scripts

    echo ""
    echo "🎉 Backup System Setup Complete!"
    echo "================================"
    echo ""
    echo "📋 Backup Scripts Created:"
    echo "✅ scripts/backup-database.sh"
    echo "✅ scripts/backup-files.sh"
    echo "✅ scripts/backup-config.sh"
    echo "✅ scripts/verify-backups.sh"
    echo "✅ scripts/restore-database.sh"
    echo "✅ scripts/restore-files.sh"
    echo ""
    echo "⏰ Automated Schedule:"
    echo "- Database: Daily at 2 AM"
    echo "- Files: Daily at 3 AM"
    echo "- Config: Weekly on Sundays at 4 AM"
    echo ""
    echo "🔍 Manual Commands:"
    echo "- Run backup: ./scripts/backup-database.sh"
    echo "- Verify backups: ./scripts/verify-backups.sh"
    echo "- Restore database: ./scripts/restore-database.sh"
    echo ""
    echo "💡 Remember to test your backups regularly!"
}

# Run main function
main "$@"