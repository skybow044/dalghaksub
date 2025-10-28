"""
Telegram Channel Monitor - Automated Message Fetcher
Fetches latest messages from a Telegram channel every hour and serves them via HTTP
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from pyrogram import Client

# ========================
# CONFIGURATION
# ========================
API_ID = '22190531'
API_HASH = '6847fd1e76ab8aef81b4cf2de346f939'
CHANNEL_USERNAME = "v2ray_dalghak"  # e.g., "@telegram" or "telegram"
OUTPUT_FILE = "latest_messages.txt"
UPDATE_INTERVAL = 3600  # 1 hour in seconds
HTTP_PORT = 8000  # Port for local web server

# Security settings
ACCESS_KEY = "your_secret_key_here"  # Change this to a secure random string
ALLOWED_IPS = []  # Leave empty to allow all IPs, or add specific IPs like ["192.168.1.100", "10.0.0.5"]

# ========================
# LOGGING SETUP
# ========================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('telegram_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ========================
# MESSAGE FETCHER
# ========================
class TelegramMonitor:
    def __init__(self, api_id, api_hash, channel_username, output_file):
        self.api_id = api_id
        self.api_hash = api_hash
        self.channel_username = channel_username
        self.output_file = output_file
        self.app = Client("telegram_monitor", api_id=api_id, api_hash=api_hash)
    
    async def fetch_messages(self):
        """Fetch the 10 latest messages from the channel"""
        try:
            logger.info(f"Fetching messages from {self.channel_username}...")
            
            async with self.app:
                messages = []
                async for message in self.app.get_chat_history(self.channel_username, limit=10):
                    # Extract text content
                    text = message.text or message.caption or "[Media/No Text]"
                    timestamp = message.date.strftime("%Y-%m-%d %H:%M:%S")
                    
                    messages.append({
                        'id': message.id,
                        'date': timestamp,
                        'text': text
                    })
                
                # Save to file (newest first)
                self.save_messages(messages)
                logger.info(f"✓ Successfully fetched {len(messages)} messages")
                return len(messages)
                
        except Exception as e:
            logger.error(f"✗ Error fetching messages: {e}")
            return 0
    
    def save_messages(self, messages):
        """Save messages to text file"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write(f"Latest 10 Messages from {self.channel_username}\n")
                f.write(f"Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                
                for i, msg in enumerate(messages, 1):
                    f.write(f"Message #{i} (ID: {msg['id']})\n")
                    f.write(f"Date: {msg['date']}\n")
                    f.write(f"Content:\n{msg['text']}\n")
                    f.write("-" * 80 + "\n\n")
            
            logger.info(f"✓ Saved to {self.output_file}")
            
        except Exception as e:
            logger.error(f"✗ Error saving messages: {e}")

# ========================
# HTTP SERVER
# ========================
class CustomHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler with logging and security"""
    
    def do_GET(self):
        """Handle GET requests with security checks"""
        client_ip = self.client_address[0]
        
        # Check IP whitelist if configured
        if ALLOWED_IPS and client_ip not in ALLOWED_IPS:
            logger.warning(f"Blocked access from unauthorized IP: {client_ip}")
            self.send_error(403, "Access denied")
            return
        
        # Check access key if provided
        if ACCESS_KEY != "your_secret_key_here":
            access_key = self.headers.get('X-Access-Key', '')
            if access_key != ACCESS_KEY:
                logger.warning(f"Blocked access from {client_ip} - invalid access key")
                self.send_error(401, "Unauthorized")
                return
        
        # Log access
        logger.info(f"HTTP: {client_ip} - {self.command} {self.path}")
        
        # Serve the file
        super().do_GET()
    
    def log_message(self, format, *args):
        """Override to prevent duplicate logging"""
        pass  # We handle logging in do_GET

def start_http_server(port):
    """Start HTTP server in background thread"""
    server = HTTPServer(('0.0.0.0', port), CustomHandler)
    logger.info(f"✓ HTTP Server started on http://0.0.0.0:{port}/{OUTPUT_FILE}")
    logger.info(f"✓ Local access: http://localhost:{port}/{OUTPUT_FILE}")
    logger.info(f"✓ Network access: http://[YOUR_IP]:{port}/{OUTPUT_FILE}")
    server.serve_forever()

# ========================
# SCHEDULER
# ========================
async def schedule_updates(monitor):
    """Run update loop every hour"""
    logger.info(f"Scheduler started - Updates every {UPDATE_INTERVAL} seconds")
    
    while True:
        try:
            # Fetch messages
            count = await monitor.fetch_messages()
            
            # Wait for next update
            next_update = datetime.now().timestamp() + UPDATE_INTERVAL
            next_time = datetime.fromtimestamp(next_update).strftime('%H:%M:%S')
            logger.info(f"Next update scheduled at {next_time}")
            
            await asyncio.sleep(UPDATE_INTERVAL)
            
        except Exception as e:
            logger.error(f"✗ Scheduler error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute on error

# ========================
# MAIN
# ========================
async def main():
    """Main application entry point"""
    logger.info("=" * 80)
    logger.info("Telegram Channel Monitor - Starting")
    logger.info("=" * 80)
    
    # Validate configuration
    if API_ID == "YOUR_API_ID" or API_HASH == "YOUR_API_HASH":
        logger.error("✗ Please set your API_ID and API_HASH in the configuration section")
        return
    
    if CHANNEL_USERNAME == "@channelname":
        logger.error("✗ Please set a valid CHANNEL_USERNAME")
        return
    
    # Start HTTP server in background
    http_thread = threading.Thread(target=start_http_server, args=(HTTP_PORT,), daemon=True)
    http_thread.start()
    
    # Create monitor instance
    monitor = TelegramMonitor(API_ID, API_HASH, CHANNEL_USERNAME, OUTPUT_FILE)
    
    # Initial fetch
    logger.info("Performing initial message fetch...")
    await monitor.fetch_messages()
    
    logger.info("\n" + "=" * 80)
    logger.info(f"✓ Monitor is now running!")
    logger.info(f"✓ Local access: http://localhost:{HTTP_PORT}/{OUTPUT_FILE}")
    logger.info(f"✓ Network access: http://[YOUR_IP]:{HTTP_PORT}/{OUTPUT_FILE}")
    logger.info(f"✓ Updates every hour")
    logger.info("=" * 80 + "\n")
    
    # Start scheduler
    await schedule_updates(monitor)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n✓ Monitor stopped by user")
    except Exception as e:
        logger.error(f"✗ Fatal error: {e}")