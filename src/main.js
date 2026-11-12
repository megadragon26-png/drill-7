import { GameController } from './core/game-controller.js';

export function startGame() {
    const game = new GameController();
    let lastTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        game.update(dt);
        game.sound.updateMusic(game);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
    return game;
}

// type=module запускается после разбора HTML.
export const game = startGame();
