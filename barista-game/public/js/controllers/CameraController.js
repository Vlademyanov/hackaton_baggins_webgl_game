class CameraController {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.camera = this.createCamera();
        this.sensitivity = 0.002; // Чувствительность мыши
        this.smoothness = 0; // Плавность движения камеры
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        
        // Заблокировать курсор при клике на canvas
        this.canvas.addEventListener("click", () => {
            this.canvas.requestPointerLock();
        });

        // Обработка движения мыши
        document.addEventListener("mousemove", (evt) => {
            if (document.pointerLockElement === this.canvas) {
                // Обновляем целевые углы поворота
                this.targetRotationX += evt.movementY * this.sensitivity;
                this.targetRotationY += evt.movementX * this.sensitivity;

                // Ограничиваем вертикальный поворот
                this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
            }
        });

        // Добавляем обновление камеры в игровой цикл
        scene.onBeforeRenderObservable.add(() => this.updateCamera());
    }

    createCamera() {
        const camera = new BABYLON.UniversalCamera(
            "playerCamera",
            new BABYLON.Vector3(0, 1.7, -5),
            this.scene
        );
        
        // Настройки камеры
        camera.minZ = 0.1;
        camera.speed = 0.2;
        camera.angularSensibility = 800;
        camera.attachControl(this.canvas, true);

        camera.inertia = 0;

        return camera;
    }

    updateCamera() {
        // Плавное обновление поворота камеры
        const currentRotationX = this.camera.rotation.x;
        const currentRotationY = this.camera.rotation.y;

        // Интерполяция между текущим и целевым поворотом
        this.camera.rotation.x += (this.targetRotationX - currentRotationX) * this.smoothness;
        this.camera.rotation.y += (this.targetRotationY - currentRotationY) * this.smoothness;

        // Ограничение вертикального поворота
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
    }

    getForwardRay(length = 100) {
        const ray = new BABYLON.Ray(
            this.camera.position,
            this.camera.getForwardRay().direction,
            length
        );
        return ray;
    }

    // Получить позицию камеры
    getPosition() {
        return this.camera.position;
    }

    // Получить направление взгляда
    getDirection() {
        return this.camera.getForwardRay().direction;
    }

    // Установить позицию камеры
    setPosition(position) {
        this.camera.position = position;
    }

    // Установить поворот камеры
    setRotation(rotation) {
        this.camera.rotation = rotation;
    }
} 