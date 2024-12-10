class InteractionManager {
    constructor(scene, camera, stationManager, customerManager, cashRegister, ui) {
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

                let hintText = "Нажмите E для взаимодействия с ";
                switch(interactionType) {
                    case "coffee_station":
                        hintText += this.currentLookAtObject.stationType;
                        break;
                    case "customer":
                        hintText += "клиентом";
                        break;
                    case "register":
                        hintText += "кассой";
                        break;
                }
                this.ui.showHint(hintText);
            } else {
                this.currentLookAtObject = null;
                this.ui.showHint("");
            }
        });

        // Обработка нажатия клавиши E
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN && 
                (kbInfo.event.key === 'e' || kbInfo.event.key === 'E')) {
                console.log('E key pressed, current object:', this.currentLookAtObject?.actionType); // Отладка
                
                if (this.currentLookAtObject) {
                    switch(this.currentLookAtObject.actionType) {
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