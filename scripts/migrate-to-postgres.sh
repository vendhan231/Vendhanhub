#!/bin/bash

# Database Migration Script: SQLite to PostgreSQL
# This script helps migrate your data from SQLite to PostgreSQL for production

set -e

echo "🗄️  Database Migration: SQLite to PostgreSQL"
echo "==========================================="

# Check if we're in the project root
if [ ! -f "employee-management-billing-backend/package.json" ]; then
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

# Check if PostgreSQL is available
check_postgres() {
    if ! command -v psql &> /dev/null; then
        echo "❌ PostgreSQL client not found. Please install PostgreSQL client tools."
        echo "Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "macOS: brew install postgresql"
        echo "CentOS/RHEL: sudo yum install postgresql"
        exit 1
    fi
}

# Backup SQLite database
backup_sqlite() {
    echo "📦 Step 1: Backing up SQLite database"
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -f "employee-management-billing-backend/prisma/dev.db" ]; then
        cp "employee-management-billing-backend/prisma/dev.db" "$BACKUP_DIR/sqlite_backup.db"
        echo "✅ SQLite database backed up to: $BACKUP_DIR/sqlite_backup.db"
    else
        echo "⚠️  No SQLite database found at employee-management-billing-backend/prisma/dev.db"
        echo "   Make sure your development database exists before migration."
        exit 1
    fi
}

# Setup PostgreSQL database
setup_postgres() {
    echo ""
    echo "🛠️  Step 2: PostgreSQL Database Setup"

    PG_HOST=$(prompt_with_default "PostgreSQL host" "localhost")
    PG_PORT=$(prompt_with_default "PostgreSQL port" "5432")
    PG_USER=$(prompt_with_default "PostgreSQL username" "postgres")
    PG_PASS=$(prompt_with_default "PostgreSQL password" "")
    PG_DB=$(prompt_with_default "Database name" "employee_db")

    # Test connection
    echo "Testing PostgreSQL connection..."
    if PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "SELECT 1;" &> /dev/null; then
        echo "✅ PostgreSQL connection successful"
    else
        echo "❌ PostgreSQL connection failed"
        echo "Please check your credentials and ensure PostgreSQL is running."
        exit 1
    fi

    # Export variables for later use
    export PG_HOST PG_PORT PG_USER PG_PASS PG_DB
}

# Generate Prisma schema for PostgreSQL
update_schema() {
    echo ""
    echo "📝 Step 3: Updating Prisma Schema"

    # Backup original schema
    cp "employee-management-billing-backend/prisma/schema.prisma" "$BACKUP_DIR/schema.prisma.backup"

    # Update schema.prisma to use PostgreSQL
    sed -i 's/provider = "sqlite"/provider = "postgresql"/g' "employee-management-billing-backend/prisma/schema.prisma"

    echo "✅ Schema updated for PostgreSQL"
}

# Migrate data using Prisma
migrate_data() {
    echo ""
    echo "🔄 Step 4: Migrating Data"

    cd employee-management-billing-backend

    # Update DATABASE_URL for PostgreSQL
    export DATABASE_URL="postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB"

    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate

    # Create migration for schema changes
    echo "Creating database migration..."
    npx prisma migrate dev --name sqlite-to-postgres --create-only

    # Apply migration to PostgreSQL
    echo "Applying migration to PostgreSQL..."
    npx prisma migrate deploy

    # Note: For data migration, you might need custom scripts
    echo "⚠️  Note: Data migration from SQLite to PostgreSQL requires custom scripts."
    echo "   Prisma migrate handles schema migration, but data migration needs manual handling."
    echo ""
    echo "   To migrate data, you can:"
    echo "   1. Use prisma db push to create tables"
    echo "   2. Write custom scripts to export from SQLite and import to PostgreSQL"
    echo "   3. Use third-party tools like pgloader"

    cd ..
}

# Update environment files
update_env() {
    echo ""
    echo "🔧 Step 5: Updating Environment Configuration"

    # Update .env files
    if [ -f ".env" ]; then
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://'"$PG_USER"':'"$PG_PASS"'@'"$PG_HOST"':'"$PG_PORT"'/'"$PG_DB"'"|g' .env
        echo "✅ Updated .env file"
    fi

    if [ -f ".env.production" ]; then
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://'"$PG_USER"':'"$PG_PASS"'@'"$PG_HOST"':'"$PG_PORT"'/'"$PG_DB"'"|g' .env.production
        echo "✅ Updated .env.production file"
    fi

    # Update docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password@db:5432/employee_db|g' docker-compose.yml
        echo "✅ Updated docker-compose.yml"
    fi
}

# Verify migration
verify_migration() {
    echo ""
    echo "✅ Step 6: Verifying Migration"

    cd employee-management-billing-backend

    # Test database connection
    if npx prisma db execute --file <(echo "SELECT 1;") &> /dev/null; then
        echo "✅ PostgreSQL database connection verified"
    else
        echo "❌ PostgreSQL database connection failed"
        exit 1
    fi

    # Check if tables exist
    TABLE_COUNT=$(npx prisma db execute --file <(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';") 2>/dev/null || echo "0")
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "✅ Database tables created successfully"
    else
        echo "⚠️  No tables found. You may need to run migrations manually."
    fi

    cd ..
}

# Main execution
main() {
    check_postgres
    backup_sqlite
    setup_postgres
    update_schema
    migrate_data
    update_env
    verify_migration

    echo ""
    echo "🎉 Migration Complete!"
    echo "===================="
    echo ""
    echo "📋 Summary:"
    echo "- SQLite database backed up to: $BACKUP_DIR"
    echo "- PostgreSQL database configured"
    echo "- Schema updated for PostgreSQL"
    echo "- Environment files updated"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. Test your application with PostgreSQL"
    echo "2. Migrate your data using custom scripts if needed"
    echo "3. Update your deployment configuration"
    echo "4. Remove SQLite database file after verification"
    echo ""
    echo "⚠️  Important: Keep your SQLite backup safe!"
    echo "   Location: $BACKUP_DIR/sqlite_backup.db"
    echo ""
    echo "🆘 If you encounter issues:"
    echo "1. Check PostgreSQL logs"
    echo "2. Verify DATABASE_URL in environment files"
    echo "3. Run: npx prisma studio to inspect database"
    echo "4. Restore from backup if needed"
}

# Run main function
main "$@"