# Environment Variables Setup Guide

## Quick Start

1. Copy this file to `.env` in the `backend/` directory
2. Update the values according to your setup

## Required Variables (Production)

In **production**, these must be set:
- `DB_HOST` - Database host
- `DB_NAME` - Database name  
- `DB_USER` - Database username
- `DB_PASS` or `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens

## Development Defaults

In **development**, defaults are provided:
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_NAME=cems`
- `DB_USER=root`
- `DB_PASS=` (empty, if no password)
- `JWT_SECRET=change_me_dev_secret_key` (auto-generated if not set)
- `JWT_REFRESH_SECRET` (auto-generated from JWT_SECRET if not set)

## Example .env File

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cems
DB_USER=root
DB_PASS=your_password_here
# Alternative: DB_PASSWORD=your_password_here

# JWT Configuration
# IMPORTANT: Change these secrets in production!
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
# Note: JWT_REFRESH_SECRET will default to JWT_SECRET + "_refresh" if not set

# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT Expiration (optional)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## Notes

- The app supports both `DB_PASS` and `DB_PASSWORD` (whichever is set will be used)
- If `JWT_REFRESH_SECRET` is not set, it will use `JWT_SECRET + "_refresh"`
- In development mode, missing variables will use defaults
- In production mode, missing required variables will cause the app to exit

