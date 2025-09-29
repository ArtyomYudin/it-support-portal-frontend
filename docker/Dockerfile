# Stage 1: Build Angular app
FROM bitnamilegacy/node:22.15.0 AS build

LABEL authors="Artyom Yudin"

ENV TZ="Europe/Moscow" \
    PYTHONUNBUFFERED=1

SHELL ["/bin/bash", "-o", "errexit", "-o", "nounset", "-o", "pipefail", "-c"]

# Install packages
#RUN install_packages openssh-client
#RUN apt-get install openssh-client net-tools -y

RUN apt-get update && apt-get upgrade -y && \
    apt-get install openssh-client net-tools -y && \
    apt-get clean && rm -rf /var/lib/apt/lists /var/cache/apt/archives

# set timezone
RUN if [ ! -z "${TZ}" ]; then ln -snf "/usr/share/zoneinfo/${TZ}" /etc/localtime && echo "${TZ}" > /etc/timezone; fi

#RUN export PATH="/opt/bitnami/python/bin:/opt/bitnami/node/bin:$PATH"
RUN echo "export PATH=/opt/bitnami/python/bin:/opt/bitnami/node/bin:${PATH}" >> /root/.bashrc

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --force

# Copy source and build Angular app
COPY . .
RUN npm run build --prod

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Удаляем дефолтный конфиг и добавляем свой для Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY --from=build /app/dist/it-support-portal-frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
