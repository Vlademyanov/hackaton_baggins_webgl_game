class AvatarManager {
    constructor(scene) {
        console.log('Initializing AvatarManager...');
        this.scene = scene;
        this.avatarCache = new Map();
        this.subdomain = config.RPM_SUBDOMAIN;
    }

    async createAnonymousUser() {
        try {
            console.log('Creating anonymous user...');
            const response = await fetch(`https://${this.subdomain}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('User creation error:', errorText);
                throw new Error(`Failed to create user: ${response.status}`);
            }

            const data = await response.json();
            console.log('Created user:', data);
            return data.data;
        } catch (error) {
            console.error('Error in createAnonymousUser:', error);
            throw error;
        }
    }

    async getAvatarTemplates(token) {
        const response = await fetch('https://api.readyplayer.me/v2/avatars/templates', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.data;
    }

    async createAvatarFromTemplate(token, templateId) {
        try {
            console.log('Creating avatar with template:', templateId);

            // 1. Создаем черновик аватара
            const response = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${templateId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        partner: "readyplayerme",
                        bodyType: "fullbody"
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Avatar creation failed:', errorText);
                throw new Error(`Failed to create avatar: ${response.status}`);
            }

            const data = await response.json();
            console.log('Draft avatar created:', data);

            // 2. Сохраняем аватар
            const avatarId = data.data.id;
            const saveResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!saveResponse.ok) {
                const errorText = await saveResponse.text();
                console.error('Avatar save failed:', errorText);
                throw new Error(`Failed to save avatar: ${saveResponse.status}`);
            }

            const savedData = await saveResponse.json();
            console.log('Avatar saved:', savedData);
            return savedData.data;
        } catch (error) {
            console.error('Error in createAvatarFromTemplate:', error);
            throw error;
        }
    }

    async createRandomAvatar() {
        try {
            // 1. Создаем анонимного пользователя
            const userData = await this.createAnonymousUser();
            console.log('User created:', userData);

            // 2. Получаем список шаблонов
            const templates = await this.getAvatarTemplates(userData.token);
            console.log('Available templates:', templates);

            // 3. Выбираем случайный шаблон
            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            console.log('Selected template:', randomTemplate);

            // 4. Создаем и сохраняем аватар из шаблона
            const avatarData = await this.createAvatarFromTemplate(userData.token, randomTemplate.id);
            console.log('Final avatar data:', avatarData);

            if (!avatarData || !avatarData.id) {
                throw new Error('No avatar ID in response');
            }

            // 5. Даем небольшую задержку для обработки аватара на серверах RPM
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 6. Загружаем GLB модель
            const avatarUrl = `https://models.readyplayer.me/${avatarData.id}.glb`;
            console.log('Loading avatar from URL:', avatarUrl);
            return await this.loadAvatarModel(avatarUrl);
        } catch (error) {
            console.error('Detailed error in createRandomAvatar:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    async loadAvatarModel(avatarUrl) {
        console.log('Loading avatar model from:', avatarUrl);

        if (this.avatarCache.has(avatarUrl)) {
            return this.avatarCache.get(avatarUrl).clone();
        }

        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                null,
                avatarUrl,
                "",
                this.scene
            );

            const avatar = result.meshes[0];
            avatar.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);

            this.avatarCache.set(avatarUrl, avatar);
            return avatar;
        } catch (error) {
            console.error('Error loading avatar model:', error);
            return null;
        }
    }
}