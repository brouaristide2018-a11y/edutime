# =============================================
# Stage 1 : Build React/Vite app
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copier tout le code source
COPY . .

# --- Gemini AI ---
ARG GEMINI_API_KEY

# --- Backend API ---
ARG VITE_API_URL

# Exposer les variables à Vite au moment du build
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV VITE_API_URL=$VITE_API_URL

# Build de production
RUN npm run build

# =============================================
# Stage 2 : Serveur Nginx (image légère)
# =============================================
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx (SPA routing + gzip + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
