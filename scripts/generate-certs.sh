#!/bin/bash

# Generate self-signed certificates for local HTTPS development
mkdir -p certificates

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certificates/localhost.key \
  -out certificates/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✅ Certificates generated in ./certificates/"
echo "📝 Add certificates/localhost.crt to your system's trusted certificates"