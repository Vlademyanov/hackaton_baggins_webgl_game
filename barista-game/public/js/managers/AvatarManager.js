class AvatarManager {
    constructor(scene) {
        this.scene = scene;
        this.avatarCache = new Map();
        this.initRPM();
    }

    initRPM() {
        this.rpmWidget = new RPMWidget({
            subdomain: 'barista-game', // Замените на ваш поддомен
            element: '#rpm-container',
            clearCache: true,
            onAvatarExported: (url) => {
                console.log('Avatar URL:', url);
                document.getElementById('rpm-container').style.display = 'none';
                return url;
            }
        });
    }

    showAvatarCreator() {
        document.getElementById('rpm-container').style.display = 'block';
        this.rpmWidget.show();
    }

    async loadAvatarForCustomer(customerId, avatarUrl) {
        if (this.avatarCache.has(avatarUrl)) {
            return this.avatarCache.get(avatarUrl).clone(`customer-${customerId}`);
        }

        try {
            // RPM возвращает glb модель
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                null,
                avatarUrl,
                "",
                this.scene
            );

            const avatar = result.meshes[0];
            // Настраиваем размер и позицию
            avatar.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);

            // Кэшируем модель
            this.avatarCache.set(avatarUrl, avatar);

            return avatar.clone(`customer-${customerId}`);
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
            return null;
        }
    }

    // Получаем случайный готовый аватар из RPM
    async getRandomAvatar() {
        const randomAvatars = [
            'https://models.readyplayer.me/random-avatar-1.glb',
            'https://models.readyplayer.me/random-avatar-2.glb',
            'https://models.readyplayer.me/random-avatar-3.glb'
            // Добавьте больше URL предварительно созданных аватаров
        ];
        return randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
    }
}