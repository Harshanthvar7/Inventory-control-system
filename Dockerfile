
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY dashboard.html .
COPY dashboard.css .
COPY dashboard.js .
COPY products.html .
COPY products.css .
COPY products.js .
COPY stock-movement.html .
COPY stock-movement.css .
COPY stock-movement.js .

# Include shared application assets
COPY shared/ ./shared/

EXPOSE 80
