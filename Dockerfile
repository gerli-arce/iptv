FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

# Se espera que hayas corrido `npm run build` en tu máquina.
# Este Dockerfile solo publica el contenido de dist como estático.
COPY dist .
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
