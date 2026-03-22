# Nginx & SSL Setup Guide for linkedinese.jervi.dev

Below is the Nginx server block configuration to proxy traffic to your Docker container natively running on port `1455`, along with the commands to activate it and secure your site using SSL.

## 1. Nginx Configuration

Create a new file at `/etc/nginx/sites-available/linkedinese.jervi.dev`. 

```bash
sudo nano /etc/nginx/sites-available/linkedinese.jervi.dev
```

Paste the following configuration into the file:

```nginx
server {
    listen 80;
    server_name linkedinese.jervi.dev;

    location / {
        proxy_pass http://127.0.0.1:1455;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Forward real IP to backend Next.js application
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 2. Nginx Setup Commands

After writing the configuration file, perform the following commands to link the site, test it, and smoothly reload Nginx to propagate the changes:

```bash
# Enable the site by creating a symlink in sites-enabled
sudo ln -s /etc/nginx/sites-available/linkedinese.jervi.dev /etc/nginx/sites-enabled/

# Test Nginx configuration for syntax errors
sudo nginx -t

# If the test is successful, reload Nginx
sudo systemctl reload nginx
```

## 3. SSL Configuration with Certbot

To generate an SSL certificate and automatically append secure HTTPS connections dynamically to your Nginx setup, simply run this command. (Ensure `certbot` and `python3-certbot-nginx` are installed on your server):

```bash
sudo certbot --nginx -d linkedinese.jervi.dev
```

Follow the prompt when it runs; Certbot is designed to automatically adjust that same configuration file you created earlier to forcefully redirect `80` (HTTP) requests into `443` (HTTPS).
