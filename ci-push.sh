#!/usr/bin/env bash
set -euo pipefail
set -x

echo "→ Starting ci-push.sh from: $(pwd)"
echo "→ Script path (argv0): $0"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to find git root directory
find_git_root() {
    echo "→ Looking for .git directory..."
    local current_dir
    current_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "→ Starting search from: $current_dir"
    
    while [ "$current_dir" != "/" ]; do
        echo "→ Checking: $current_dir/.git"
        if [ -d "$current_dir/.git" ]; then
            echo "→ Found Git root at: $current_dir"
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done
    
    echo "→ No .git directory found"
    return 1
}

# Main script
main() {
    log_info "Starting CI push script..."
    
    # Step 1: Discover project root
    echo "→ Step: Discover project root"
    log_info "Looking for project root directory..."
    PROJECT_ROOT=$(find_git_root) || {
        log_error "Could not find .git directory in any parent directory"
        exit 1
    }
    log_info "Found project root: $PROJECT_ROOT"
    
    # Step 2: Safely change to project root
    echo "→ Step: Change to project root"
    log_info "Changing to project root directory..."
    cd "$PROJECT_ROOT" || {
        log_error "Failed to change directory to: $PROJECT_ROOT"
        exit 1
    }
    log_info "Current directory: $(pwd)"
    
    # Step 3: Check git status
    echo "→ Step: Check git status"
    log_info "Checking git status..."
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not a git repository"
        exit 1
    fi
    
    # Get current branch
    echo "→ Getting current branch"
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "Current branch: $CURRENT_BRANCH"
    
    # Step 4: Create or checkout branch
    echo "→ Step: Create or checkout branch"
    BRANCH_NAME="phase-5-deployment-setup"
    log_info "Switching to branch: $BRANCH_NAME"
    
    echo "→ Checking if branch exists"
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        log_warning "Branch '$BRANCH_NAME' already exists, checking it out..."
        echo "→ Executing: git checkout $BRANCH_NAME"
        git checkout "$BRANCH_NAME" || {
            log_error "Failed to checkout existing branch: $BRANCH_NAME"
            exit 1
        }
    else
        log_info "Creating new branch: $BRANCH_NAME"
        echo "→ Executing: git checkout -b $BRANCH_NAME"
        git checkout -b "$BRANCH_NAME" || {
            log_error "Failed to create new branch: $BRANCH_NAME"
            exit 1
        }
    fi
    
    # Step 5: Stage all changes
    echo "→ Step: Stage all changes"
    log_info "Staging all changes..."
    echo "→ Executing: git add -A"
    git add -A || {
        log_error "Failed to stage changes"
        exit 1
    }
    
    # Check if there are changes to commit
    echo "→ Checking for staged changes"
    if git diff --staged --quiet; then
        log_warning "No changes to commit"
        
        # Check if we need to push existing commits
        echo "→ Checking remote branch status"
        if git rev-parse --verify --quiet "origin/$BRANCH_NAME" > /dev/null 2>&1; then
            LOCAL_COMMIT=$(git rev-parse HEAD)
            REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH_NAME")
            echo "→ Local commit: $LOCAL_COMMIT"
            echo "→ Remote commit: $REMOTE_COMMIT"
            
            if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
                log_info "Branch is up to date with origin"
                exit 0
            else
                log_info "Local branch has unpushed commits"
            fi
        else
            log_info "Branch does not exist on remote"
        fi
    else
        # Step 6: Commit changes
        echo "→ Step: Commit changes"
        log_info "Committing changes..."
        COMMIT_MSG="deploy: phase-5 setup

- Added production deployment configuration
- Created service worker and PWA setup
- Configured Prisma schema and seed data
- Added Docker and Vercel configurations
- Set up health check and cron endpoints"
        
        echo "→ Executing: git commit"
        git commit -m "$COMMIT_MSG" || {
            log_error "Failed to commit changes"
            exit 1
        }
        log_info "Changes committed successfully"
    fi
    
    # Step 7: Push to origin
    echo "→ Step: Push to origin"
    log_info "Pushing to origin..."
    
    # Check if remote exists
    echo "→ Checking if remote 'origin' exists"
    if ! git remote | grep -q "^origin$"; then
        log_error "Remote 'origin' not found"
        exit 1
    fi
    
    # Push with upstream tracking
    echo "→ Checking if remote branch exists"
    if git rev-parse --verify --quiet "origin/$BRANCH_NAME" > /dev/null 2>&1; then
        log_info "Pushing to existing remote branch..."
        echo "→ Executing: git push origin $BRANCH_NAME"
        git push origin "$BRANCH_NAME" || {
            log_error "Failed to push to origin"
            exit 1
        }
    else
        log_info "Pushing new branch to origin..."
        echo "→ Executing: git push -u origin $BRANCH_NAME"
        git push -u origin "$BRANCH_NAME" || {
            log_error "Failed to push new branch to origin"
            exit 1
        }
    fi
    
    log_info "Successfully pushed to origin/$BRANCH_NAME"
    
    # Step 8: Show summary
    echo "→ Step: Show summary"
    echo ""
    log_info "========== Summary =========="
    log_info "Project root: $PROJECT_ROOT"
    log_info "Branch: $BRANCH_NAME"
    log_info "Remote: origin"
    log_info "Status: Successfully pushed"
    
    # Show recent commits
    echo ""
    log_info "Recent commits on this branch:"
    git log --oneline -5
    
    echo ""
    log_info "Push completed successfully!"
}

# Execute main function
echo "→ Calling main function"
main "$@"