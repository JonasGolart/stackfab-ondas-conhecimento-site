# StackFab: Site estático "Ondas do Conhecimento" via Nginx
# Deploy: node sf-deploy.js --name ondas-do-conhecimento --dir . --port 80 --buildpack dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
