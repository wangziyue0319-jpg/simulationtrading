#!/bin/bash

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Starting Fund Data Service..."
python main.py
