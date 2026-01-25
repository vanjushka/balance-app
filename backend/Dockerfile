FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
        git \
        unzip \
        oniguruma-dev \
        libzip-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        zip \
        exif \
        pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Important:
# - We DO NOT run `composer install` during image build because the app source
#   is mounted as a volume in docker-compose.
# - Dependencies will be installed inside the running container.

EXPOSE 9000

CMD ["php-fpm"]
