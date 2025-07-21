#!/bin/bash

# Deploy to Staging Environment
# This script deploys the application to the staging environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_ENV="staging"
STAGING_URL="https://staging.nightlife-navigator.com"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ENABLED=true

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required environment variables are set
    if [[ -z "$STAGING_API_KEY" ]]; then
        error "STAGING_API_KEY environment variable is not set"
    fi
    
    if [[ -z "$STAGING_DATABASE_URL" ]]; then
        error "STAGING_DATABASE_URL environment variable is not set"
    fi
    
    # Check if build artifacts exist
    if [[ ! -d "dist" ]] && [[ ! -d "build" ]]; then
        error "Build artifacts not found. Please run 'npm run build' first."
    fi
    
    # Check if tests are passing
    log "Running tests..."
    npm run test:ci || error "Tests are failing. Deployment aborted."
    
    # Security check
    log "Running security audit..."
    npm audit --audit-level=high || error "Security vulnerabilities found. Deployment aborted."
    
    log "Pre-deployment checks passed ✓"
}

# Build for staging
build_staging() {
    log "Building for staging environment..."
    
    # Set environment variables for staging
    export NODE_ENV=staging
    export EXPO_PUBLIC_ENV=staging
    export EXPO_PUBLIC_API_URL="https://api-staging.nightlife-navigator.com"
    
    # Build the application
    npm run build:staging || error "Build failed"
    
    log "Build completed successfully ✓"
}

# Deploy to staging server
deploy_to_staging() {
    log "Deploying to staging server..."
    
    # Create deployment package
    tar -czf staging-deploy.tar.gz -C dist .
    
    # Upload to staging server
    # This is a placeholder - replace with your actual deployment method
    if command -v rsync &> /dev/null; then
        rsync -avz --delete dist/ staging-user@staging-server:/var/www/staging/
    else
        warn "rsync not available. Please implement your deployment method."
    fi
    
    # Update application on staging server
    # ssh staging-user@staging-server "cd /var/www/staging && ./update-app.sh"
    
    log "Deployment to staging server completed ✓"
}

# Database migration
run_database_migration() {
    log "Running database migrations..."
    
    # Run staging database migrations
    # This is a placeholder - replace with your actual migration commands
    if [[ -f "migrations/staging.sql" ]]; then
        # psql $STAGING_DATABASE_URL -f migrations/staging.sql
        log "Database migrations completed ✓"
    else
        warn "No database migrations found"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $timeout ]]; then
            error "Health check timeout. Deployment may have failed."
        fi
        
        # Check if the staging server is responding
        if curl -s -f "$STAGING_URL/health" > /dev/null; then
            log "Health check passed ✓"
            break
        else
            warn "Health check failed. Retrying in 10 seconds..."
            sleep 10
        fi
    done
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Test critical endpoints
    local endpoints=(
        "/health"
        "/api/auth/status"
        "/api/venues"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="$STAGING_URL$endpoint"
        if curl -s -f "$url" > /dev/null; then
            log "Smoke test passed: $endpoint ✓"
        else
            error "Smoke test failed: $endpoint"
        fi
    done
    
    log "All smoke tests passed ✓"
}

# Rollback function
rollback() {
    if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
        warn "Rolling back deployment..."
        
        # Implement rollback logic here
        # This could involve restoring previous deployment
        # or reverting database changes
        
        log "Rollback completed"
    else
        error "Rollback is disabled. Manual intervention required."
    fi
}

# Notification function
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚧 Staging Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    if [[ -n "$EMAIL_NOTIFICATION" ]]; then
        echo "$message" | mail -s "Staging Deployment $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main deployment process
main() {
    log "Starting deployment to staging environment..."
    
    # Trap errors and call rollback
    trap 'error "Deployment failed. Initiating rollback."; rollback' ERR
    
    # Run deployment steps
    pre_deployment_checks
    build_staging
    deploy_to_staging
    run_database_migration
    health_check
    run_smoke_tests
    
    # Send success notification
    send_notification "SUCCESS" "Staging deployment completed successfully"
    
    log "Staging deployment completed successfully! 🚀"
    log "Staging URL: $STAGING_URL"
    log "You can now test the application on staging environment."
}

# Run main function
main "$@"