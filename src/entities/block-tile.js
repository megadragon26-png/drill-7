/**
 * Состояние отдельной клетки шахты.
 */
import { TILE_TYPES } from '../data/tiles.js';

export class BlockTile {
    constructor(gridX, gridY, proto, hpMultiplier = 1) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.proto = proto;
        this.maxHp = Math.round(proto.hp * hpMultiplier);
        this.hp = this.maxHp;
        this.wobbleTimer = 0;
        this.isWobbling = false;
        this.pressureTimer = 0; // Накопление давления для газовых карманов рядом с буром
        this.bgType = null;     // Тип фоновой локации ('cave', 'bunker', 'ruins', 'geode')
        this.frozen = false;
        this.structureId = null;
    }

    isEmpty() {
        return this.proto.id === TILE_TYPES.EMPTY.id;
    }
}
