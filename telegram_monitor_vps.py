# Telegram Monitor - VPS Configuration
# Optimized for 1 CPU, 2GB RAM, 40GB SSD

# ========================
# CONFIGURATION
# ========================
API_ID = '22190531'
API_HASH = '6847fd1e76ab8aef81b4cf2de346f939'
CHANNEL_USERNAME = "v2ray_dalghak"
OUTPUT_FILE = "latest_messages.txt"
UPDATE_INTERVAL = 3600  # 1 hour in seconds
HTTP_PORT = 8000  # Port for web server

# Security settings for VPS
ACCESS_KEY = "your_secure_key_change_this"  # Change this!
ALLOWED_IPS = []  # Leave empty for all IPs, or add specific IPs

# VPS Optimizations
MAX_MESSAGES = 10  # Limit messages to save memory
LOG_LEVEL = "INFO"  # INFO, WARNING, ERROR
CLEANUP_OLD_LOGS = True  # Auto cleanup old log files

# ========================
# LOGGING SETUP (VPS Optimized)
# ========================
import logging
import os
from datetime import datetime, timedelta

# Create logs directory
os.makedirs('/opt/telegram-monitor/logs', exist_ok=True)

# Configure logging with rotation
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/telegram-monitor/logs/telegram_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Cleanup old logs if enabled
if CLEANUP_OLD_LOGS:
    try:
        for file in os.listdir('/opt/telegram-monitor/logs'):
            if file.endswith('.log'):
                file_path = os.path.join('/opt/telegram-monitor/logs', file)
                # Delete logs older than 7 days
                if os.path.getmtime(file_path) < (datetime.now() - timedelta(days=7)).timestamp():
                    os.remove(file_path)
                    logger.info(f"Cleaned up old log: {file}")
    except Exception as e:
        logger.warning(f"Log cleanup failed: {e}")

# ========================
# MESSAGE FETCHER (Memory Optimized)
# ========================
class TelegramMonitor:
    def __init__(self, api_id, api_hash, channel_username, output_file):
        self.api_id = api_id
        self.api_hash = api_hash
        self.channel_username = channel_username
        self.output_file = output_file
        self.app = Client("telegram_monitor", api_id=api_id, api_hash=api_hash)
    
    async def fetch_messages(self):
        """Fetch latest messages with memory optimization"""
        try:
            logger.info(f"Fetching messages from {self.channel_username}...")
            
            async with self.app:
                messages = []
                count = 0
                async for message in self.app.get_chat_history(self.channel_username, limit=MAX_MESSAGES):
                    if count >= MAX_MESSAGES:
                        break
                    
                    # Extract text content (memory efficient)
                    text = message.text or message.caption or "[Media/No Text]"
                    timestamp = message.date.strftime("%Y-%m-%d %H:%M:%S")
                    
                    messages.append({
                        'id': message.id,
                        'date': timestamp,
                        'text': text[:1000]  # Limit text length to save memory
                    })
                    count += 1
                
                # Save to file
                self.save_messages(messages)
                logger.info(f"✓ Successfully fetched {len(messages)} messages")
                return len(messages)
                
        except Exception as e:
            logger.error(f"✗ Error fetching messages: {e}")
            return 0
    
    def save_messages(self, messages):
        """Save messages to file with error handling"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                f.write(f"Latest {len(messages)} Messages from {self.channel_username}\n")
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
# HTTP SERVER (VPS Optimized)
# ========================
class CustomHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler with security and logging"""
    
    def do_GET(self):
        """Handle GET requests with security checks"""
        client_ip = self.client_address[0]
        
        # Check IP whitelist if configured
        if ALLOWED_IPS and client_ip not in ALLOWED_IPS:
            logger.warning(f"Blocked access from unauthorized IP: {client_ip}")
            self.send_error(403, "Access denied")
            return
        
        # Check access key if provided
        if ACCESS_KEY != "your_secure_key_change_this":
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
        pass

def start_http_server(port):
    """Start HTTP server optimized for VPS"""
    server = HTTPServer(('0.0.0.0', port), CustomHandler)
    logger.info(f"✓ HTTP Server started on port {port}")
    logger.info(f"✓ Access: http://[VPS_IP]:{port}/{OUTPUT_FILE}")
    server.serve_forever()

# ========================
# MAIN APPLICATION
# ========================
async def main():
    """Main application entry point for VPS"""
    logger.info("=" * 80)
    logger.info("Telegram Channel Monitor - VPS Version")
    logger.info("=" * 80)
    
    # Validate configuration
    if API_ID == "YOUR_API_ID" or API_HASH == "YOUR_API_HASH":
        logger.error("✗ Please set your API_ID and API_HASH")
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
    
    logger.info("✓ Monitor is now running on VPS!")
    logger.info(f"✓ Access: http://[VPS_IP]:{port}/{OUTPUT_FILE}")
    
    # Start scheduler
    while True:
        try:
            await monitor.fetch_messages()
            await asyncio.sleep(UPDATE_INTERVAL)
        except Exception as e:
            logger.error(f"✗ Scheduler error: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("✓ Monitor stopped")
    except Exception as e:
        logger.error(f"✗ Fatal error: {e}")
