class CustomerManager {
    constructor(scene, ui) {
        this.scene = scene;
        this.ui = ui;
        this.customerZone = this.createCustomerZone();
        this.currentCustomer = null;
        this.orderStatus = 'waiting'; // waiting -> ordered -> preparing -> ready -> completed -> finished
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

    async handleCustomerInteraction() {
        try {
            console.log('Текущий статус заказа:', this.orderStatus);
            if (this.orderStatus === 'waiting') {
                const response = await fetch('/api/customer/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                console.log('Ответ от сервера:', data);

                if (data.success) {
                    this.currentCustomer = data.customer;
                    this.orderStatus = 'ordered';

                    if (this.ui) {
                        const message = `Клиент ${data.customer.name} хочет заказать ${data.customer.order.drink}. 
                            Пройдите к кассе для оформления заказа.`;
                        this.ui.showHint(message);
                    }
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
            } else if (this.orderStatus === 'finished') {
                this.orderStatus = 'waiting';
                this.ui.showHint('Готовы к новому заказу');
            }
        } catch (error) {
            console.error('Ошибка при взаимодействии с клиентом:', error);
            if (this.ui) {
                this.ui.showHint('Произошла ошибка при обработке заказа');
            }
        }
    }

    async updateCustomerInfo() {
        try {
            console.log('Запрос информации о текущем клиенте...');
            const response = await fetch('/api/customer/current');
            const data = await response.json();
            console.log('Полученные данные:', data);

            if (data.currentCustomer) {
                this.currentCustomer = data.currentCustomer;
                this.orderStatus = 'waiting';
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
}