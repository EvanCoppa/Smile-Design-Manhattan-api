#!/bin/bash

# Navigate to project directory
cd ~/Smile-Design-Manhattan-api

# Pull latest changes from Git
git pull origin main

# Run import_billables script
cd api
node import_billables.js

# Restart pm2 processes
pm2 restart all