/**
 * HelkaMoveController - 赫尔卡星移动控制器
 * 职责：玩家点击移动、可行走区限制、自动寻路与方向动画联动。
 */
class HelkaMoveController {
    constructor(scene) {
        this.scene = scene;
        this._tweenState = {
            tween: null,
            target: null,
            direction: null
        };

        this._walkableRects = null;
        this._walkablePolygons = null;

        this.pathSampleStep = 12;
        this.navGridStep = 24;
        this._activeMoveToken = 0;

        this.playerMoveMsPerPixel = 9;
        this.playerMoveMinDuration = 360;
        this.playerMoveMaxDuration = 5200;
        this.playerMoveStartDelay = 0;
        this.playerMoveEase = 'Linear';
    }

    /**
     * 创建全屏可点击移动区域
     * @param {number} width
     * @param {number} height
     */
    createMoveArea(width, height) {
        const moveZone = this.scene.add.zone(width / 2, height / 2, width, height);
        moveZone.setDepth(0);
        moveZone.setInteractive();

        moveZone.on('pointerup', (pointer) => {
            this.movePlayerTo(pointer.x, pointer.y);
        });
    }

    /**
     * 点击移动到目标点
     * @param {number} targetX
     * @param {number} targetY
     */
    movePlayerTo(targetX, targetY) {
        if (!this.scene.player || !this.scene.player.scene) {
            return;
        }

        const bounds = this.getPlayerMoveBounds();
        const clampedX = Phaser.Math.Clamp(targetX, bounds.minX, bounds.maxX);
        const clampedY = Phaser.Math.Clamp(targetY, bounds.minY, bounds.maxY);

        if (!this.isPointWalkable(clampedX, clampedY)) {
            return;
        }

        const startX = this.scene.player.x;
        const startY = this.scene.player.y;
        const path = this.findPath(startX, startY, clampedX, clampedY, bounds);
        if (!path || !path.length) {
            return;
        }

        if (this._tweenState.tween) {
            this._tweenState.tween.stop();
            this._tweenState.tween = null;
        }

        this._activeMoveToken += 1;
        const token = this._activeMoveToken;

        this.followPath(path, token, bounds);
    }

    /**
     * 依次执行路径点移动
     * @param {Array<{x:number,y:number}>} path
     * @param {number} token
     * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
     */
    followPath(path, token, bounds) {
        if (token !== this._activeMoveToken) {
            return;
        }

        if (!Array.isArray(path) || !path.length) {
            if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                this.scene.playerAnimator.playIdle(this.scene.playerDirection || 'front');
            }
            return;
        }

        const nextPoint = path.shift();
        const result = MovementSystem.movePlayerTo(
            this.scene,
            this.scene.player,
            nextPoint.x,
            nextPoint.y,
            bounds,
            {
                msPerPixel: this.playerMoveMsPerPixel,
                minDuration: this.playerMoveMinDuration,
                maxDuration: this.playerMoveMaxDuration,
                startDelay: this.playerMoveStartDelay,
                ease: this.playerMoveEase,
                _tweenState: this._tweenState,
                onDirectionChange: (direction, distance, duration) => {
                    this.scene.playerDirection = direction;
                    if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playMove === 'function') {
                        this.scene.playerAnimator.playMove(direction, distance, duration);
                    }
                },
                onMoveComplete: (direction) => {
                    if (token !== this._activeMoveToken) {
                        return;
                    }

                    this.scene.playerX = Math.round(this.scene.player.x);
                    this.scene.playerY = Math.round(this.scene.player.y);

                    if (path.length) {
                        this.followPath(path, token, bounds);
                        return;
                    }

                    if (this.scene.playerAnimator && typeof this.scene.playerAnimator.playIdle === 'function') {
                        this.scene.playerAnimator.playIdle(direction);
                    }
                }
            }
        );

        if (!result) {
            this.followPath(path, token, bounds);
        }
    }

    /**
     * 路径规划
     * @param {number} startX
     * @param {number} startY
     * @param {number} endX
     * @param {number} endY
     * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds
     * @returns {Array<{x:number,y:number}>|null}
     */
    findPath(startX, startY, endX, endY, bounds) {
        if (this.isSegmentWalkable(startX, startY, endX, endY)) {
            return [{ x: endX, y: endY }];
        }

        const grid = this.buildNavGrid(bounds);
        if (!grid.cols || !grid.rows) {
            return null;
        }

        const startCell = this.findNearestWalkableCell(this.worldToCell(startX, startY, grid), grid, 4);
        const endCell = this.findNearestWalkableCell(this.worldToCell(endX, endY, grid), grid, 4);
        if (!startCell || !endCell) {
            return null;
        }

        const cellPath = this.aStar(startCell, endCell, grid);
        if (!cellPath || !cellPath.length) {
            return null;
        }

        const rawPoints = cellPath.map((cell) => this.cellToWorld(cell, grid));
        rawPoints.push({ x: endX, y: endY });

        return this.simplifyPath({ x: startX, y: startY }, rawPoints);
    }

    /**
     * 构建导航网格
     */
    buildNavGrid(bounds) {
        const step = this.navGridStep;
        const cols = Math.max(1, Math.floor((bounds.maxX - bounds.minX) / step) + 1);
        const rows = Math.max(1, Math.floor((bounds.maxY - bounds.minY) / step) + 1);

        return {
            step,
            cols,
            rows,
            minX: bounds.minX,
            minY: bounds.minY,
            maxX: bounds.maxX,
            maxY: bounds.maxY
        };
    }

    worldToCell(x, y, grid) {
        const cx = Phaser.Math.Clamp(Math.round((x - grid.minX) / grid.step), 0, grid.cols - 1);
        const cy = Phaser.Math.Clamp(Math.round((y - grid.minY) / grid.step), 0, grid.rows - 1);
        return { cx, cy };
    }

    cellToWorld(cell, grid) {
        return {
            x: Phaser.Math.Clamp(grid.minX + cell.cx * grid.step, grid.minX, grid.maxX),
            y: Phaser.Math.Clamp(grid.minY + cell.cy * grid.step, grid.minY, grid.maxY)
        };
    }

    findNearestWalkableCell(cell, grid, maxRadius) {
        if (this.isCellWalkable(cell, grid)) {
            return cell;
        }

        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const candidate = {
                        cx: cell.cx + dx,
                        cy: cell.cy + dy
                    };
                    if (!this.isCellInsideGrid(candidate, grid)) {
                        continue;
                    }
                    if (this.isCellWalkable(candidate, grid)) {
                        return candidate;
                    }
                }
            }
        }

        return null;
    }

    isCellInsideGrid(cell, grid) {
        return cell.cx >= 0 && cell.cx < grid.cols && cell.cy >= 0 && cell.cy < grid.rows;
    }

    isCellWalkable(cell, grid) {
        if (!this.isCellInsideGrid(cell, grid)) {
            return false;
        }

        const point = this.cellToWorld(cell, grid);
        return this.isPointWalkable(point.x, point.y);
    }

    aStar(startCell, endCell, grid) {
        const startKey = this.cellKey(startCell);
        const endKey = this.cellKey(endCell);
        const openKeys = [startKey];
        const openSet = new Set([startKey]);
        const cameFrom = {};
        const gScore = { [startKey]: 0 };
        const fScore = { [startKey]: this.cellHeuristic(startCell, endCell) };

        while (openKeys.length) {
            let currentIndex = 0;
            for (let i = 1; i < openKeys.length; i++) {
                if ((fScore[openKeys[i]] ?? Number.POSITIVE_INFINITY)
                    < (fScore[openKeys[currentIndex]] ?? Number.POSITIVE_INFINITY)) {
                    currentIndex = i;
                }
            }

            const currentKey = openKeys[currentIndex];
            openKeys.splice(currentIndex, 1);
            openSet.delete(currentKey);

            if (currentKey === endKey) {
                return this.rebuildCellPath(cameFrom, currentKey);
            }

            const current = this.keyToCell(currentKey);
            const neighbors = this.getNeighborCells(current, grid);
            for (const neighbor of neighbors) {
                if (!this.isCellWalkable(neighbor, grid)) {
                    continue;
                }

                const currentPoint = this.cellToWorld(current, grid);
                const neighborPoint = this.cellToWorld(neighbor, grid);
                if (!this.isSegmentWalkable(currentPoint.x, currentPoint.y, neighborPoint.x, neighborPoint.y)) {
                    continue;
                }

                const neighborKey = this.cellKey(neighbor);
                const tentativeG = (gScore[currentKey] ?? Number.POSITIVE_INFINITY)
                    + Phaser.Math.Distance.Between(current.cx, current.cy, neighbor.cx, neighbor.cy);

                if (tentativeG >= (gScore[neighborKey] ?? Number.POSITIVE_INFINITY)) {
                    continue;
                }

                cameFrom[neighborKey] = currentKey;
                gScore[neighborKey] = tentativeG;
                fScore[neighborKey] = tentativeG + this.cellHeuristic(neighbor, endCell);

                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                    openKeys.push(neighborKey);
                }
            }
        }

        return null;
    }

    getNeighborCells(cell, grid) {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                const next = {
                    cx: cell.cx + dx,
                    cy: cell.cy + dy
                };
                if (this.isCellInsideGrid(next, grid)) {
                    neighbors.push(next);
                }
            }
        }
        return neighbors;
    }

    cellHeuristic(a, b) {
        return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
    }

    rebuildCellPath(cameFrom, endKey) {
        const path = [];
        let currentKey = endKey;
        while (currentKey) {
            path.unshift(this.keyToCell(currentKey));
            currentKey = cameFrom[currentKey];
        }
        return path;
    }

    simplifyPath(startPoint, points) {
        if (!Array.isArray(points) || !points.length) {
            return [];
        }

        const simplified = [];
        let anchor = { x: startPoint.x, y: startPoint.y };
        let index = 0;

        while (index < points.length) {
            let furthest = index;
            for (let i = index; i < points.length; i++) {
                const candidate = points[i];
                if (this.isSegmentWalkable(anchor.x, anchor.y, candidate.x, candidate.y)) {
                    furthest = i;
                    continue;
                }
                break;
            }

            const chosen = points[furthest];
            simplified.push({ x: chosen.x, y: chosen.y });
            anchor = chosen;
            index = furthest + 1;
        }

        return simplified;
    }

    cellKey(cell) {
        return `${cell.cx},${cell.cy}`;
    }

    keyToCell(key) {
        const [cxRaw, cyRaw] = key.split(',');
        return {
            cx: Number.parseInt(cxRaw, 10),
            cy: Number.parseInt(cyRaw, 10)
        };
    }

    /**
     * 判定点是否在可行走区内
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isPointWalkable(x, y) {
        const rects = this.getWalkableRects();
        const polygons = this.getWalkablePolygons();

        if (!rects.length && !polygons.length) {
            return true;
        }

        for (const rect of rects) {
            if (Phaser.Geom.Rectangle.Contains(rect, x, y)) {
                return true;
            }
        }

        return polygons.some((polygon) => Phaser.Geom.Polygon.Contains(polygon, x, y));
    }

    /**
     * 判定线段是否全程在可行走区内
     * @param {number} startX
     * @param {number} startY
     * @param {number} endX
     * @param {number} endY
     * @returns {boolean}
     */
    isSegmentWalkable(startX, startY, endX, endY) {
        if (!this.isPointWalkable(endX, endY)) {
            return false;
        }

        const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const samples = Math.max(2, Math.ceil(distance / this.pathSampleStep));
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const sampleX = Phaser.Math.Linear(startX, endX, t);
            const sampleY = Phaser.Math.Linear(startY, endY, t);
            if (!this.isPointWalkable(sampleX, sampleY)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 获取可行走矩形（运行时缓存）
     * @returns {Phaser.Geom.Rectangle[]}
     */
    getWalkableRects() {
        if (this._walkableRects) {
            return this._walkableRects;
        }

        const rects = this.scene
            && this.scene.runtimeSceneConfig
            && Array.isArray(this.scene.runtimeSceneConfig.walkableRects)
            ? this.scene.runtimeSceneConfig.walkableRects
            : [];

        this._walkableRects = rects
            .filter((rect) => rect
                && Number.isFinite(rect.x)
                && Number.isFinite(rect.y)
                && Number.isFinite(rect.width)
                && Number.isFinite(rect.height)
                && rect.width > 0
                && rect.height > 0)
            .map((rect) => new Phaser.Geom.Rectangle(rect.x, rect.y, rect.width, rect.height));

        return this._walkableRects;
    }

    /**
     * 获取可行走多边形（运行时缓存）
     * @returns {Phaser.Geom.Polygon[]}
     */
    getWalkablePolygons() {
        if (this._walkablePolygons) {
            return this._walkablePolygons;
        }

        const zones = this.scene
            && this.scene.runtimeSceneConfig
            && Array.isArray(this.scene.runtimeSceneConfig.walkableZones)
            ? this.scene.runtimeSceneConfig.walkableZones
            : [];

        this._walkablePolygons = zones
            .filter((zone) => Array.isArray(zone) && zone.length >= 3)
            .map((zone) => new Phaser.Geom.Polygon(zone.map((point) => ({ x: point.x, y: point.y }))));

        return this._walkablePolygons;
    }

    /**
     * 获取玩家移动边界
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number }}
     */
    getPlayerMoveBounds() {
        const { width, height } = this.scene.cameras.main;
        return {
            minX: 50,
            maxX: width - 50,
            minY: 96,
            maxY: height - 70
        };
    }
}

window.HelkaMoveController = HelkaMoveController;
