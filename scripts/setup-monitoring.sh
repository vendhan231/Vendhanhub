#!/bin/bash

# Monitoring Setup Script for Employee Management System
# This script helps configure monitoring, logging, and error tracking

set -e

echo "📊 Setting up Monitoring & Error Tracking"
echo "========================================"

# Check if we're in the project root
if [ ! -f "package.json" ]; then
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

# Setup Sentry for error tracking
setup_sentry() {
    echo ""
    echo "🐛 Step 1: Sentry Error Tracking Setup"
    echo "-------------------------------------"

    USE_SENTRY=$(prompt_with_default "Set up Sentry error tracking? (y/n)" "y")
    if [ "$USE_SENTRY" = "y" ]; then
        echo "Sentry Setup Instructions:"
        echo "1. Go to https://sentry.io and create an account"
        echo "2. Create a new project for your application"
        echo "3. Copy the DSN from the project settings"
        read -p "Enter your Sentry DSN: " SENTRY_DSN

        if [ -n "$SENTRY_DSN" ]; then
            # Install Sentry
            echo "Installing Sentry..."
            npm install @sentry/react @sentry/tracing

            # Add Sentry to frontend
            cat >> index.tsx << 'EOF'

// Sentry error tracking
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
EOF

            # Add Sentry to backend
            cd employee-management-billing-backend
            npm install @sentry/node @sentry/profiling-node

            cat >> src/server.ts << 'EOF'
// Sentry error tracking
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
EOF

            cd ..

            # Update environment files
            echo "VITE_SENTRY_DSN=$SENTRY_DSN" >> .env.production
            echo "SENTRY_DSN=$SENTRY_DSN" >> employee-management-billing-backend/.env.production

            echo "✅ Sentry configured successfully"
        fi
    fi
}

# Setup logging
setup_logging() {
    echo ""
    echo "📝 Step 2: Logging Configuration"
    echo "-------------------------------"

    USE_WINSTON=$(prompt_with_default "Set up Winston logging? (y/n)" "y")
    if [ "$USE_WINSTON" = "y" ]; then
        cd employee-management-billing-backend
        npm install winston winston-daily-rotate-file

        # Create logger utility
        mkdir -p src/utils
        cat > src/utils/logger.ts << 'EOF'
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file logging in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports
});

export default logger;
EOF

        # Update server.ts to use logger
        sed -i '1i import logger from "./utils/logger";' src/server.ts
        sed -i 's/console.log/logger.info/g' src/server.ts
        sed -i 's/console.error/logger.error/g' src/server.ts

        cd ..

        echo "✅ Winston logging configured"
    fi
}

# Setup Prometheus metrics
setup_prometheus() {
    echo ""
    echo "📈 Step 3: Prometheus Metrics Setup"
    echo "-----------------------------------"

    USE_PROMETHEUS=$(prompt_with_default "Set up Prometheus metrics? (y/n)" "y")
    if [ "$USE_PROMETHEUS" = "y" ]; then
        cd employee-management-billing-backend
        npm install prom-client

        # Create metrics middleware
        cat > src/api/middleware/metrics.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });

  next();
};

export const getMetrics = async () => {
  return register.metrics();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};
EOF

        # Update server.ts
        sed -i '1i import { metricsMiddleware, metricsEndpoint } from "./api/middleware/metrics.middleware";' src/server.ts

        # Add metrics route
        echo 'app.get("/metrics", metricsMiddleware, metricsEndpoint);' >> src/server.ts

        # Add metrics middleware
        sed -i 's/app.use(errorMiddleware);/app.use(metricsMiddleware);\napp.use(errorMiddleware);/g' src/server.ts

        cd ..

        # Create Prometheus configuration
        cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'employee-management-system'
    static_configs:
      - targets: ['localhost:3001']
EOF

        # Create docker-compose override for monitoring
        cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - app-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - app-network
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
EOF

        echo "✅ Prometheus metrics configured"
        echo "📊 Access Grafana at: http://localhost:3002 (admin/admin)"
    fi
}

# Setup health checks and alerts
setup_alerts() {
    echo ""
    echo "🚨 Step 4: Alert Manager Setup"
    echo "-----------------------------"

    USE_ALERTS=$(prompt_with_default "Set up Alert Manager? (y/n)" "n")
    if [ "$USE_ALERTS" = "y" ]; then
        cat > alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@yourdomain.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'email'
  routes:
  - match:
      alertname: 'ServiceDown'
    receiver: 'email'

receivers:
- name: 'email'
  email_configs:
  - to: 'admin@yourdomain.com'
    send_resolved: true
EOF

        cat > docker-compose.alerts.yml << 'EOF'
version: '3.8'

services:
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - app-network
    restart: unless-stopped
EOF

        echo "✅ Alert Manager configured"
    fi
}

# Setup log aggregation
setup_log_aggregation() {
    echo ""
    echo "📋 Step 5: Log Aggregation Setup"
    echo "--------------------------------"

    USE_ELK=$(prompt_with_default "Set up ELK stack for log aggregation? (y/n)" "n")
    if [ "$USE_ELK" = "y" ]; then
        cat > docker-compose.elk.yml << 'EOF'
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
      - xpack.monitoring.enabled=false
      - xpack.graph.enabled=false
      - xpack.watcher.enabled=false
      - xpack.ml.enabled=false
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - app-network
    restart: unless-stopped

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch
    networks:
      - app-network
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - app-network
    restart: unless-stopped

volumes:
  elasticsearch_data:
EOF

        cat > logstash.conf << 'EOF'
input {
  tcp {
    port => 5044
    codec => json_lines
  }
}

filter {
  if [level] {
    mutate {
      add_field => { "log_level" => "%{level}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
EOF

        echo "✅ ELK stack configured"
        echo "🔍 Access Kibana at: http://localhost:5601"
    fi
}

# Main execution
main() {
    setup_sentry
    setup_logging
    setup_prometheus
    setup_alerts
    setup_log_aggregation

    echo ""
    echo "🎉 Monitoring Setup Complete!"
    echo "============================="
    echo ""
    echo "📋 Configured Services:"
    if [ "$USE_SENTRY" = "y" ]; then
        echo "✅ Sentry Error Tracking"
    fi
    if [ "$USE_WINSTON" = "y" ]; then
        echo "✅ Winston Logging"
    fi
    if [ "$USE_PROMETHEUS" = "y" ]; then
        echo "✅ Prometheus Metrics"
        echo "✅ Grafana Dashboard"
    fi
    if [ "$USE_ALERTS" = "y" ]; then
        echo "✅ Alert Manager"
    fi
    if [ "$USE_ELK" = "y" ]; then
        echo "✅ ELK Stack (Elasticsearch, Logstash, Kibana)"
    fi
    echo ""
    echo "🚀 To start monitoring services:"
    echo "docker-compose -f docker-compose.monitoring.yml up -d"
    if [ "$USE_ALERTS" = "y" ]; then
        echo "docker-compose -f docker-compose.alerts.yml up -d"
    fi
    if [ "$USE_ELK" = "y" ]; then
        echo "docker-compose -f docker-compose.elk.yml up -d"
    fi
    echo ""
    echo "📊 Access URLs:"
    echo "- Grafana: http://localhost:3002 (admin/admin)"
    echo "- Prometheus: http://localhost:9090"
    echo "- Kibana: http://localhost:5601"
    echo "- Alert Manager: http://localhost:9093"
}

# Run main function
main "$@"