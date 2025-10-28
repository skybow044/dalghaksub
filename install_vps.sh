#!/bin/bash
# Telegram Monitor VPS Installation Script
# Run this script on your Ubuntu VPS

echo "🚀 Installing Telegram Monitor on VPS..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10 and pip
sudo apt install python3.10 python3.10-pip python3.10-venv -y

# Install required packages
sudo apt install git curl wget ufw -y

# Create application directory
mkdir -p /opt/telegram-monitor
cd /opt/telegram-monitor

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install pyrogram

# Create systemd service file
sudo tee /etc/systemd/system/telegram-monitor.service > /dev/null <<EOF
[Unit]
Description=Telegram Channel Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/telegram-monitor
Environment=PATH=/opt/telegram-monitor/venv/bin
ExecStart=/opt/telegram-monitor/venv/bin/python telegram_monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
sudo ufw allow 8000/tcp
sudo ufw --force enable

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable telegram-monitor
sudo systemctl start telegram-monitor

echo "✅ Installation completed!"
echo "📁 Upload your telegram_monitor.py to /opt/telegram-monitor/"
echo "🔧 Edit configuration in the Python file"
echo "🔄 Restart service: sudo systemctl restart telegram-monitor"
echo "📊 Check status: sudo systemctl status telegram-monitor"
echo "📝 View logs: sudo journalctl -u telegram-monitor -f"
