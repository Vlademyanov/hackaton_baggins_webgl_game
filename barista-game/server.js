const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware для обработки JSON
app.use(express.json());

// Настройка статических файлов
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// Конфигурация игры
const DRINKS = {
    'американо': {
        steps: ['espresso', 'hot_water'],
        difficulty: 2,
        points: 10
    },
    'латте': {
        steps: ['espresso', 'steamed_milk', 'milk_foam'],
        difficulty: 3,
        points: 20
    },
    'капучино': {
        steps: ['espresso', 'steamed_milk', 'milk_foam'],
        difficulty: 3,
        points: 20
    },
    'эспрессо': {
        steps: ['espresso'],
        difficulty: 1,
        points: 5
    }
};

// Состояние игры
let gameState = {
    currentCustomer: null,
    currentOrder: null,
    orderStatus: 'waiting',
    playerScore: 0,
    customerCount: 0,
    customerQueue: [],
    maxQueueLength: 5
};

// Функция генерации клиента
function generateCustomer() {
    const drinks = Object.keys(DRINKS);
    const randomDrink = drinks[Math.floor(Math.random() * drinks.length)];

    gameState.customerCount++;
    return {
        id: gameState.customerCount,
        name: `Клиент ${gameState.customerCount}`,
        order: {
            drink: randomDrink,
            requirements: DRINKS[randomDrink].steps
        },
        patience: 100,
        arrivalTime: Date.now()
    };
}

// Функция пополнения очереди
function fillQueue() {
    while (gameState.customerQueue.length < gameState.maxQueueLength) {
        gameState.customerQueue.push(generateCustomer());
    }
}

// Добавим функцию логирования
function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// API для взаимодействия с клиентом
app.post('/api/customer/interact', (req, res) => {
    log('Customer interaction requested', {
        currentCustomer: gameState.currentCustomer,
        orderStatus: gameState.orderStatus
    });

    if (!gameState.currentCustomer) {
        if (gameState.customerQueue.length === 0) {
            fillQueue();
        }

        gameState.currentCustomer = gameState.customerQueue.shift();
        gameState.orderStatus = 'ordered';

        log('New customer created', gameState.currentCustomer);

        res.json({
            success: true,
            customer: gameState.currentCustomer,
            message: 'Заказ принят'
        });
    } else {
        log('Customer interaction failed - customer already exists');
        res.json({
            success: false,
            message: 'Уже есть активный клиент'
        });
    }
});

// API для получения информации о текущем клиенте
app.get('/api/customer/current', (req, res) => {
    res.json({
        currentCustomer: gameState.currentCustomer,
        orderStatus: gameState.orderStatus
    });
});

// API для получения информации об очереди
app.get('/api/customer/queue', (req, res) => {
    // Пополняем очередь перед отправкой информации
    fillQueue();

    res.json({
        queue: gameState.customerQueue,
        queueLength: gameState.customerQueue.length
    });
});

// API для завершения заказа
app.post('/api/order/complete', (req, res) => {
    log('Order completion requested', {
        currentCustomer: gameState.currentCustomer,
        orderStatus: gameState.orderStatus
    });

    if (gameState.currentCustomer && gameState.orderStatus === 'ready') {
        const drink = gameState.currentCustomer.order.drink;
        const points = DRINKS[drink].points;
        gameState.playerScore += points;

        log('Order completed successfully', {
            drink,
            points,
            totalScore: gameState.playerScore
        });

        // Сбрасываем состояние
        gameState.currentCustomer = null;
        gameState.orderStatus = 'waiting';

        // Пополняем очередь после завершения заказа
        fillQueue();

        res.json({
            success: true,
            points: points,
            totalScore: gameState.playerScore,
            message: `Заказ выполнен! Получено ${points} очков`
        });
    } else {
        log('Order completion failed', {
            hasCustomer: !!gameState.currentCustomer,
            orderStatus: gameState.orderStatus
        });

        res.json({
            success: false,
            message: 'Заказ еще не готов или нет активного клиента'
        });
    }
});

// API для обновления статуса заказа
app.post('/api/order/status', (req, res) => {
    const { status } = req.body;
    log('Status update requested', {
        oldStatus: gameState.orderStatus,
        newStatus: status
    });

    if (gameState.currentCustomer) {
        gameState.orderStatus = status;
        res.json({
            success: true,
            status: gameState.orderStatus
        });
    } else {
        res.json({
            success: false,
            message: 'Нет активного клиента'
        });
    }
});

// API для получения текущего состояния
app.get('/api/game/state', (req, res) => {
    log('Game state requested');
    res.json({
        currentCustomer: gameState.currentCustomer,
        orderStatus: gameState.orderStatus,
        playerScore: gameState.playerScore,
        queueLength: gameState.customerQueue.length
    });
});

// Маршруты для статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Инициализация очереди при запуске сервера
fillQueue();

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});