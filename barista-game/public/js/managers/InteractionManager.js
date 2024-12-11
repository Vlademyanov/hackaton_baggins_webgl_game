class InteractionManager {
    constructor(scene, camera, stationManager, customerManager, cashRegister, ui) {
        console.log('InteractionManager version 2');
        this.scene = scene;
        this.camera = camera;
        this.stationManager = stationManager;
        this.customerManager = customerManager;
        this.cashRegister = cashRegister;
        this.ui = ui;
        this.currentLookAtObject = null;

        console.log('InteractionManager initialized with:', {
            hasCamera: !!camera,
            hasStationManager: !!stationManager,
            hasCustomerManager: !!customerManager,
            hasCashRegister: !!cashRegister,
            hasUI: !!ui
        });

        this.setupInteractions();
    }

    setupInteractions() {
        // Проверка, на что смотрит игрок
        this.scene.onBeforeRenderObservable.add(() => {
            const ray = this.camera.getForwardRay(100);
            const interactiveObjects = [
                ...this.stationManager.getInteractiveObjects(),
                ...this.customerManager.getInteractiveObjects(),
                ...this.cashRegister.getInteractiveObjects()
            ];

            const hit = this.scene.pickWithRay(ray, (mesh) => {
                return interactiveObjects.includes(mesh);
            });

            if (hit.pickedMesh) {
                this.currentLookAtObject = hit.pickedMesh;
                const interactionType = this.currentLookAtObject.actionType;
                console.log('Looking at:', interactionType); // Отладка

                let actionText = "";
                switch (interactionType) {
                    case "coffee_station":
                        actionText = `Взаимодействовать с ${this.currentLookAtObject.stationType}`;
                        break;
                    case "customer":
                        actionText = "Взаимодействовать с клиентом";
                        break;
                    case "register":
                        actionText = "Взаимодействовать с кассой";
                        break;
                }
                this.ui.showControlHint(actionText);
            } else {
                this.currentLookAtObject = null;
                this.ui.showControlHint(null);
            }
        });

        // Обработка нажатия клавиши E
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
                pointerInfo.event.button === 0) { // 0 = ЛКМ

                if (this.currentLookAtObject) {
                    switch (this.currentLookAtObject.actionType) {
                        case "coffee_station":
                            console.log('Interacting with coffee station');
                            this.stationManager.handleStationInteraction(this.currentLookAtObject);
                            break;
                        case "customer":
                            console.log('Interacting with customer');
                            this.customerManager.handleCustomerInteraction();
                            break;
                        case "register":
                            console.log('Interacting with register');
                            this.cashRegister.handleRegisterInteraction();
                            break;
                    }
                }
            }
        });
    }
}