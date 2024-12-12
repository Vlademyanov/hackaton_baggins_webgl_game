class CustomerManager {
    constructor(scene, ui) {
        this.scene = scene;
        this.ui = ui;
        this.avatarManager = new AvatarManager(scene);
        this.customerZone = this.createCustomerZone();
        this.currentCustomer = null;
        this.orderStatus = 'waiting';

        this.decorativeAvatar = null;
        this.positions = {
            service: new BABYLON.Vector3(0, 0, 0),
            exit: new BABYLON.Vector3(-7, 0, 2)
        };

        this.createDecorativeAvatar();
    }

    createCustomerZone() {
        const zone = BABYLON.MeshBuilder.CreateBox(
            "customer", { height: 2, width: 1, depth: 1 },
            this.scene
        );
        zone.position = new BABYLON.Vector3(0, 1, 0);
        zone.actionType = "customer";

        const material = new BABYLON.StandardMaterial("customerMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(1, 1, 0);
        zone.material = material;

        return zone;
    }

    async createDecorativeAvatar() {
        try {
            const avatar = await this.avatarManager.createRandomAvatar();
            if (avatar) {
                this.decorativeAvatar = avatar;
                avatar.position = new BABYLON.Vector3(
                    this.customerZone.position.x,
                    0,
                    this.customerZone.position.z
                );
                avatar.rotation = new BABYLON.Vector3(0, Math.PI, 0);
            }
        } catch (error) {
            console.error('Error creating decorative avatar:', error);
        }
    }

    async handleCustomerInteraction() {
        try {
            if (this.orderStatus === 'waiting') {
                const response = await fetch('/api/customer/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();

                if (data.success) {
                    this.currentCustomer = data.customer;
                    this.orderStatus = 'ordered';

                    if (this.ui) {
                        const message = `Клиент ${data.customer.name} хочет заказать ${data.customer.order.drink}. 
                            Пройдите к кассе для оформления заказа.`;
                        this.ui.showHint(message);
                    }
                }

                if (this.decorativeAvatar) {
                    this.decorativeAvatar.position = this.customerZone.position.clone();
                    this.decorativeAvatar.position.y = 0;
                }
            } else if (this.orderStatus === 'ready') {
                const response = await fetch('/api/order/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (data.success) {
                    this.orderStatus = 'finished';
                    this.currentCustomer = null;

                    if (this.ui) {
                        this.ui.showHint(`Заказ выполнен! Получено ${data.points} очков. Общий счет: ${data.totalScore}. 
                            Нажмите E на клиенте для нового заказа.`);
                    }
                }

                if (this.decorativeAvatar) {
                    await this.animateAvatarExit();
                    await this.createDecorativeAvatar();
                }
            } else if (this.orderStatus === 'finished') {
                this.orderStatus = 'waiting';
                this.ui.showHint('Готовы к новому заказу');
            }
        } catch (error) {
            console.error('Error in handleCustomerInteraction:', error);
        }
    }

    async animateAvatarExit() {
        if (!this.decorativeAvatar) return;

        const animation = new BABYLON.Animation(
            "customerExit",
            "position",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({
            frame: 0,
            value: this.decorativeAvatar.position.clone()
        });
        keys.push({
            frame: 30,
            value: this.positions.exit
        });

        animation.setKeys(keys);
        this.decorativeAvatar.animations = [animation];

        await this.scene.beginAnimation(this.decorativeAvatar, 0, 30, false).waitAsync();
        this.decorativeAvatar.dispose();
        this.decorativeAvatar = null;
    }

    async updateCustomerInfo() {
        try {
            const response = await fetch('/api/customer/current');
            const data = await response.json();

            if (data.currentCustomer) {
                this.ui.showHint(
                    `Клиент ${data.currentCustomer.name} ждет заказ: ${data.currentCustomer.order.drink}`
                );
            } else {
                this.ui.showHint("Ожидание клиента...");
            }
        } catch (error) {
            console.error('Ошибка при получении информации о клиенте:', error);
        }
    }

    getOrderStatus() {
        return this.orderStatus;
    }

    async setOrderStatus(status) {
        try {
            const response = await fetch('/api/order/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const data = await response.json();
            if (data.success) {
                this.orderStatus = status;
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
        }
    }

    getCurrentCustomer() {
        return this.currentCustomer;
    }

    getInteractiveObjects() {
        return [this.customerZone];
    }

    async createCustomer(customerData) {
        try {
            // Получаем URL случайного аватара
            const avatarUrl = await this.avatarManager.getRandomAvatar();
            // Загружаем 3D модель

            const avatar = await this.avatarManager.loadAvatarForCustomer(
                customerData.id,
                avatarUrl
            );
            // Позиционируем аватар

            if (avatar) {
                avatar.position = this.customerZone.position.clone();
                // Добавляем анимацию ожидания
                avatar.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                // Сохраняем ссылку на аватар в данных клиента

                const idleAnim = this.scene.beginAnimation(avatar.skeleton, 0, 100, true);

                customerData.avatar = avatar;
                customerData.animation = idleAnim;
            }

            return customerData;
        } catch (error) {
            console.error('Ошибка создания клиента:', error);
            return null;
        }
    }
}