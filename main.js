'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

const username = getUsername();
function getUsername() {
    const roomObject = Object.values(Game.structures).concat(Object.values(Game.creeps), Object.values(Game.powerCreeps), Object.values(Game.constructionSites))[0];
    const ownableObject = roomObject;
    return ownableObject.my ? ownableObject.owner.username : "";
}
const settings = {
    username: username,
    allies: ["Atanner", "slowmotionghost", "Timendainum", "FeTiD", "SBense", "6g3y", username],
    nukeStructures: [STRUCTURE_SPAWN, STRUCTURE_LAB, STRUCTURE_STORAGE, STRUCTURE_FACTORY,
        STRUCTURE_TERMINAL, STRUCTURE_POWER_SPAWN, STRUCTURE_NUKER],
    militaryBoosts: ["XKHO2", "XGHO2", "XZHO2", "XLHO2", "XZH2O", "G"],
    civBoosts: ["XLH2O", "XUHO2", "XKH2O", "XUH2O", "XGH2O"],
    roomplanTime: 500,
    roomplanOffset: 155,
    cMTime: 400,
    cMOffset: 39,
    // market
    creditMin: 1000000,
    powerPrice: 8,
    upgradeBoostPrice: 500,
    powerBuyVolume: 5000,
    processPower: false,
    rcl8upgrade: true,
    miningDisabled: [],
    mineralAmount: 50000,
    ghodiumAmount: 7000,
    boostsNeeded: 6000,
    boostAmount: 5000,
    wallHeight: [0, 0, 0, 30000, 100000, 500000, 2000000, 5000000],
    flagCleanup: 2000,
    depositFlagRemoveTime: 100000,
    addRemote: 0.7,
    removeRemote: 0.9,
    spawnFreeTime: 0.25,
    spawnFreeTimeBuffer: 0.15,
    bucket: {
        resourceMining: 1000,
        repair: 1500,
        processPower: 2200,
        colony: 2000,
        upgrade: 7000,
        energyMining: 4000,
        powerMining: 5000,
        mineralMining: 8000,
        // other constants we use with these
        range: 3000,
        //If range + range/2 > 10000, there may be times where a mining flag is not placed even though the bucket is full
        rclMultiplier: 200,
        growthLimit: 5, // average bucket growth limit over 100+ ticks
    },
    energy: {
        repair: 60000,
        rcl8upgrade: 450000,
        processPower: 400000,
        powerMine: 350000
    },
    max: {
        runners: 15,
        builders: 3,
        transporters: 2,
        miners: 1, // TODO: this shouldn't be in use anymore
    },
    motion: {
        backRoadPenalty: 1.5,
        pathFailThreshold: 3,
        pathFailRetry: 53 // number of ticks to wait before trying to find a path again after hitting the threshold
    },
    scouting: {
        assessTime: 500,
        controllerRoom: [20000, 5000, 5000, 10000, 15000, 20000, 40000, 60000, 100000],
        sk: 100000,
        highway: 10000000
    },
    minerUpdateTime: 50,
    powerMiningRange: 2,
    miningRange: 7,
    observerFrequency: 20,
    // Profiling
    profileFrequency: 19,
    profileLength: 1,
    profileResultsLength: 50,
    // Stats
    statTime: 19,
    resourceStatTime: 19 * 50,
    //Data
    backupTime: 52 //backupTime * statTime = backup interval
};
if (!Game.shard.name.includes("shard") || Game.shard.name == "shardSeason") {
    //botarena, swc and seasonal custom settings
    settings.allies = [username];
    settings.processPower = false;
    settings.rcl8upgrade = false;
    settings.powerMiningRange = 4; //manhattan distance that we can powermine (in rooms)
}
if (!Memory.settings) {
    Memory.settings = {
        allies: settings.allies
    };
}
var settings_1 = settings;

const u = {
    getsetd: function (object, prop, defaultValue) {
        if (object[prop] === undefined) {
            object[prop] = defaultValue;
        }
        return object[prop];
    },
    getRoomCache: function (roomName) {
        const roomsCache = u.getsetd(Cache, "rooms", {});
        return u.getsetd(roomsCache, roomName, {});
    },
    getCreepCache: function (creepId) {
        const creepsCache = u.getsetd(Cache, "creeps", {});
        return u.getsetd(creepsCache, creepId, {});
    },
    getLabCache: function (labId) {
        const labsCache = u.getsetd(Cache, "labs", {});
        return u.getsetd(labsCache, labId, {});
    },
    iReservedOrOwn: function (roomName) {
        const room = Game.rooms[roomName];
        const hasController = room && room.controller;
        return hasController && (room.controller.my || ((room.controller.reservation) && (room.controller.reservation.username == settings_1.username)));
    },
    iReserved: function (roomName) {
        const room = Game.rooms[roomName];
        const hasController = room && room.controller;
        return hasController && ((room.controller.reservation) && (room.controller.reservation.username == settings_1.username));
    },
    iOwn: function (roomName) {
        const room = Game.rooms[roomName];
        const hasController = room && room.controller;
        return hasController && room.controller.my;
    },
    enemyOwned: function (room) {
        return room.controller && room.controller.owner && !u.isFriendlyRoom(room);
    },
    getDropTotals: function () {
        const rooms = Game.rooms;
        const drops = _.flatten(_.map(rooms, room => room.find(FIND_DROPPED_RESOURCES)));
        return _.sum(_.map(drops, drop => drop.amount));
    },
    silenceCreeps: function () {
        if (Game.time % 10 == 0) {
            for (const creep of Object.values(Game.creeps)) {
                if (!creep.memory.notify && creep.ticksToLive < CREEP_LIFE_TIME) {
                    creep.notifyWhenAttacked(false);
                    creep.memory.notify = true;
                }
            }
        }
    },
    splitCreepsByCity: function () {
        if (!Tmp.creepsByCity)
            Tmp.creepsByCity = _.groupBy(Game.creeps, creep => creep.memory.city);
        return Tmp.creepsByCity;
    },
    splitRoomsByCity: function () {
        if (!Tmp.roomsByCity) {
            const rooms = _.filter(Game.rooms, room => u.iReservedOrOwn(room.name));
            Tmp.roomsByCity = _.groupBy(rooms, room => room.memory.city);
        }
        return Tmp.roomsByCity;
    },
    getMyCities: function () {
        if (!Tmp.myCities)
            Tmp.myCities = _.filter(Game.rooms, (room) => u.iOwn(room.name));
        return Tmp.myCities;
    },
    highwayMoveSettings: function (maxOps, swampCost, startPos, endPos, avoidEnemies = false) {
        return {
            plainCost: 1,
            swampCost: swampCost,
            maxOps: maxOps,
            maxRooms: 64,
            roomCallback: function (roomName) {
                const startRoom = roomName == startPos.roomName;
                const isHighway = u.isHighway(roomName);
                const isBad = avoidEnemies && Cache[roomName] && Cache[roomName].enemy;
                const nearStart = u.roomInRange(2, startPos.roomName, roomName);
                const nearEnd = u.roomInRange(2, endPos.roomName, roomName);
                if (((!isHighway && !nearStart && !nearEnd) || isBad) && !startRoom) {
                    return false;
                }
                const costs = new PathFinder.CostMatrix();
                return costs;
            }
        };
    },
    findMultiRoomPath: function (startPos, endPos) {
        return PathFinder.search(startPos, { pos: endPos, range: 24 }, u.highwayMoveSettings(10000, 1, startPos, endPos));
    },
    parseCoords: function (roomName) {
        const coords = roomName.match(/[0-9]+/g);
        if (!coords || coords.length != 2) {
            Log.error("Invalid room name: " + roomName);
            return { x: -1, y: -1 };
        }
        return { x: Number(coords[0]), y: Number(coords[1]) };
    },
    // E0,E10... W0, 10 ..., N0, N10 ...
    isHighway: function (roomName) {
        const coords = u.parseCoords(roomName);
        return (coords.x % 10 == 0) || (coords.y % 10 == 0);
    },
    isIntersection: function (roomName) {
        const coords = u.parseCoords(roomName);
        return (coords.x % 10 == 0) && (coords.y % 10 == 0);
    },
    // return true if room is a Source Keeper room
    isSKRoom: function (roomName) {
        const coords = u.parseCoords(roomName);
        // x mod 10 between 4 and 6, y mod 10 between 4 and 6, but not both mod 10 equal to 5
        const xmod = coords.x % 10;
        const ymod = coords.y % 10;
        return (xmod >= 4 && xmod <= 6) && (ymod >= 4 && ymod <= 6) && !(xmod == 5 && ymod == 5);
    },
    isCenterRoom: function (roomName) {
        const coords = u.parseCoords(roomName);
        return (coords.x % 10 == 5) && (coords.y % 10 == 5);
    },
    getAllRoomsInRange: function (d, rooms) {
        const size = 2 * d + 1;
        return _(rooms)
            .map(u.roomNameToPos)
            .map(pos => u.generateRoomList(pos[0] - d, pos[1] - d, size, size))
            .flatten()
            .value();
    },
    roomInRange: function (range, roomName1, roomName2) {
        const pos1 = u.roomNameToPos(roomName1);
        const pos2 = u.roomNameToPos(roomName2);
        return (Math.abs(pos1[0] - pos2[0]) <= range) && (Math.abs(pos1[1] - pos2[1]) <= range);
    },
    getRemoteSourceDistance: function (spawnPos, sourcePos) {
        const result = PathFinder.search(spawnPos, { pos: sourcePos, range: 1 }, {
            plainCost: 1,
            swampCost: 1,
            maxOps: 10000,
            roomCallback: function (rN) {
                const safe = Memory.remotes[rN]
                    || (Cache.roomData[rN] && Cache.roomData[rN].own == settings_1.username)
                    || u.isHighway(rN)
                    || rN == sourcePos.roomName;
                if (!safe)
                    return false;
            }
        });
        if (result.incomplete) {
            return -1;
        }
        return result.path.length;
    },
    roomNameToPos: function (roomName) {
        const quad = roomName.match(/[NSEW]/g);
        const coords = roomName.match(/[0-9]+/g);
        const x = Number(coords[0]);
        const y = Number(coords[1]);
        return [
            quad[0] === "W" ? -1 - x : x,
            quad[1] === "S" ? -1 - y : y
        ];
    },
    roomPosToName: function (roomPos) {
        const x = roomPos[0];
        const y = roomPos[1];
        return (x < 0 ? "W" + String(-x - 1) : "E" + String(x)) +
            (y < 0 ? "S" + String(-y - 1) : "N" + String(y));
    },
    isFriendlyRoom: function (room) {
        if ((Memory.remotes && Memory.remotes[room.name]) || room.controller
            && (room.controller.my
                || (room.controller.owner
                    && Memory.settings.allies.includes(room.controller.owner.username))
                || (room.controller.reservation
                    && Memory.settings.allies.includes(room.controller.reservation.username)))) {
            return true;
        }
        else {
            return false;
        }
    },
    isEnemyRoom: function (room) {
        const roomDataCache = u.getsetd(Cache, "roomData", {});
        const roomData = u.getsetd(roomDataCache, room.name, {});
        if ((room.controller
            && ((room.controller.owner && !Memory.settings.allies.includes(room.controller.owner.username))
                || (room.controller.reservation && !Memory.settings.allies.includes(room.controller.reservation.username))))
            || (roomData.skL && roomData.rcl))
            return true;
        return false;
    },
    findHostileCreeps: function (room) {
        return _.filter(room.find(FIND_HOSTILE_CREEPS).concat(room.find(FIND_HOSTILE_POWER_CREEPS)), c => !Memory.settings.allies.includes(c.owner.username));
    },
    findFriendlyCreeps: function (room) {
        return _.filter(room.find(FIND_CREEPS).concat(room.find(FIND_POWER_CREEPS)), c => Memory.settings.allies.includes(c.owner.username));
    },
    findHostileStructures: function (room) {
        if (u.isEnemyRoom(room)) {
            return _.filter(room.find(FIND_STRUCTURES), s => s.hits);
        }
        else if (u.isSKRoom(room.name)) {
            return _.filter(room.find(FIND_HOSTILE_STRUCTURES), s => s.hits);
        }
        return [];
    },
    generateRoomList: function (minX, minY, sizeX, sizeY) {
        return _(Array(sizeX)).map((oldX, i) => {
            return _(Array(sizeY)).map((oldY, j) => {
                return u.roomPosToName([minX + i, minY + j]);
            }).value();
        }).flatten().value();
    },
    findExitPos: function (roomName, exit) {
        if (Game.rooms[roomName]) {
            return Game.rooms[roomName].find(exit);
        }
        const exits = [];
        let constSide = 0;
        let loopVar = "x";
        let constVar = "y";
        switch (exit) {
            case FIND_EXIT_TOP:
                constSide = 0;
                loopVar = "x";
                constVar = "y";
                break;
            case FIND_EXIT_BOTTOM:
                constSide = 49;
                loopVar = "x";
                constVar = "y";
                break;
            case FIND_EXIT_RIGHT:
                constSide = 49;
                loopVar = "y";
                constVar = "x";
                break;
            case FIND_EXIT_LEFT:
                constSide = 0;
                loopVar = "y";
                constVar = "x";
                break;
        }
        const terrain = new Room.Terrain(roomName);
        for (let i = 0; i < 49; i++) {
            const newPos = {};
            newPos[loopVar] = i;
            newPos[constVar] = constSide;
            if (!terrain.get(newPos.x, newPos.y)) { //terrain is plain
                exits.push(new RoomPosition(newPos.x, newPos.y, roomName));
            }
        }
        return exits;
    },
    //combine store of all cities given
    empireStore: function (cities) {
        const empireStore = {};
        for (const resource of RESOURCES_ALL) {
            if (!cities.length) {
                empireStore[resource] = 0;
            }
            else {
                empireStore[resource] = _.sum(cities, city => {
                    const terminal = city.terminal;
                    const terminalAmount = (terminal && terminal.store.getUsedCapacity(resource)) || 0;
                    const storage = city.storage;
                    const storageAmount = (storage && storage.store.getUsedCapacity(resource)) || 0;
                    return (terminal && terminalAmount + storageAmount) || 0;
                });
            }
        }
        return empireStore;
    },
    cacheBoostsAvailable: function (cities) {
        const empireStore = u.empireStore(cities);
        const cityCount = _.filter(cities, city => city.controller.level >= 7).length || 1;
        const boosts = settings_1.civBoosts.concat(settings_1.militaryBoosts);
        const boostQuantityRequired = settings_1.boostsNeeded * cityCount;
        const boostsAvailable = _(boosts)
            .filter(boost => empireStore[boost] >= boostQuantityRequired)
            .value();
        Cache.boostsAvailable = boostsAvailable;
        Cache.boostCheckTime = Game.time;
    },
    boostsAvailable: function (role, room) {
        if (!Cache.boostsAvailable || Game.time - Cache.boostCheckTime > 1000) {
            const cities = u.getMyCities();
            u.cacheBoostsAvailable(cities);
        }
        const boostsAvailable = Cache.boostsAvailable || [];
        return _(role.boosts).every(boost => boostsAvailable.includes(boost))
            || (room && room.terminal && _(role.boosts).every(boost => room.terminal.store[boost] >= LAB_MINERAL_CAPACITY));
    },
    removeFlags: function (roomName) {
        for (const flagName of Object.keys(Memory.flags)) {
            if (Memory.flags[flagName].roomName == roomName) {
                delete Memory.flags[flagName];
            }
        }
    },
    generateFlagName: function (baseName) {
        let counter = 0;
        while (Memory.flags[baseName + counter]) {
            counter++;
        }
        return baseName + counter;
    },
    cleanFlags: function () {
        if (!Memory.flags)
            return;
        for (const flagName of Object.keys(Memory.flags)) {
            Memory.flags[flagName].removeTime = Memory.flags[flagName].removeTime || Game.time + 20000;
            if (Game.time > Memory.flags[flagName].removeTime) {
                delete Memory.flags[flagName];
            }
        }
    },
    placeFlag: function (flagName, roomPos, removeTime = 20000) {
        Memory.flags[flagName] = roomPos;
        Memory.flags[flagName].removeTime = removeTime + Game.time;
    },
    packPos: function (pos) {
        return (pos.x * 50) + pos.y;
    },
    unpackPos: function (pos, roomName) {
        return new RoomPosition(Math.floor(pos / 50), pos % 50, roomName);
    },
    getTypeFromBoost: function (boost) {
        const types = Object.keys(BOOSTS);
        for (let i = 0; i < types.length; i++) {
            if (BOOSTS[types[i]][boost]) {
                return types[i];
            }
        }
        return null;
    },
    getRangeTo: function (pos, targetPos) {
        if (pos.roomName == targetPos.roomName) {
            return pos.getRangeTo(targetPos);
        }
        const worldPos = u.toWorldPosition(pos);
        const targetWorldPos = u.toWorldPosition(targetPos);
        return Math.max(Math.abs(worldPos.x - targetWorldPos.x), Math.abs(worldPos.y - targetWorldPos.y));
        //convert to world position
    },
    toWorldPosition: function (pos) {
        const kWorldSize = Game.map.getWorldSize() / 2 - 1;
        const room = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(pos.roomName);
        return { "x": pos.x + 50 * (kWorldSize + (room[1] === "W" ? -Number(room[2]) : Number(room[2]) + 1)), "y": pos.y + 50 * (kWorldSize + (room[3] === "N" ? -Number(room[4]) : Number(room[4]) + 1)) };
    },
    removeConstruction: function () {
        if (Object.keys(Game.constructionSites).length > 1) {
            return;
        }
        for (const id in Game.constructionSites) {
            const site = Game.constructionSites[id];
            if (site.progress == 0)
                site.remove();
        }
    }
};
var utils = u;

const fact = {
    runFactory: function (city) {
        fact.initFactoryMem(city);
        if (Game.spawns[city].memory.ferryInfo.factoryInfo.produce === "dormant" || !Game.spawns[city].memory.ferryInfo.factoryInfo.produce) {
            if (Game.time % 100 != 0) {
                return;
            }
            Game.spawns[city].memory.ferryInfo.factoryInfo.produce = RESOURCE_ORGANISM; //will result in reset
        }
        const factory = fact.findFactory(city);
        if (!factory) {
            return;
        }
        fact.react(factory, city);
        //TODO: decision making, requesting minerals etc.
    },
    initFactoryMem: function (city) {
        if (!Game.spawns[city].memory.ferryInfo) {
            Game.spawns[city].memory.ferryInfo = {};
        }
        if (!Game.spawns[city].memory.ferryInfo.factoryInfo) {
            Game.spawns[city].memory.ferryInfo.factoryInfo = {};
            Game.spawns[city].memory.ferryInfo.comSend = []; //list of commodities to be delivered as soon as the terminal is ready
            Game.spawns[city].memory.ferryInfo.factoryInfo.produce = null;
            Game.spawns[city].memory.ferryInfo.factoryInfo.factoryLevel = null;
            Game.spawns[city].memory.ferryInfo.factoryInfo.transfer = [];
        }
    },
    findFactory: function (city) {
        const structures = Game.spawns[city].room.find(FIND_MY_STRUCTURES);
        const factory = _.find(structures, struct => struct.structureType === STRUCTURE_FACTORY);
        if (!factory) {
            return 0;
        }
        if (factory.level !== Game.spawns[city].memory.ferryInfo.factoryInfo.factoryLevel) {
            if (!Game.spawns[city].memory.ferryInfo.factoryInfo.factoryLevel) {
                //schedule removal of all commodities
                fact.removeJunk(city, Game.spawns[city].room.terminal);
            }
            Game.spawns[city].memory.ferryInfo.factoryInfo.factoryLevel = factory.level;
        }
        return factory;
    },
    react: function (factory, city) {
        if (!factory.cooldown && Game.spawns[city].memory.ferryInfo.factoryInfo.produce) {
            const produce = Game.spawns[city].memory.ferryInfo.factoryInfo.produce;
            const components = Object.keys(COMMODITIES[produce].components);
            let go = true;
            for (let i = 0; i < components.length; i++) {
                if (COMMODITIES[produce].components[components[i]] > factory.store[components[i]]) {
                    go = false;
                }
            }
            if (go) {
                factory.produce(produce);
            }
            else {
                if (Game.time % 10 === 0) {
                    fact.restock(factory, city, produce); // maybe run this every 10 to save cpu?
                }
            }
            return;
        }
        if (Game.time % 10 === 0 && Game.spawns[city].memory.ferryInfo.factoryInfo.produce) {
            const produce = Game.spawns[city].memory.ferryInfo.factoryInfo.produce;
            const components = Object.keys(COMMODITIES[produce].components);
            let go = true;
            for (let i = 0; i < components.length; i++) {
                if (COMMODITIES[produce].components[components[i]] > factory.store[components[i]]) {
                    go = false;
                }
            }
            if (!go) {
                fact.restock(factory, city, produce);
            }
        }
    },
    restock: function (factory, city, produce) {
        if (!Game.spawns[city].memory.ferryInfo.factoryInfo.transfer.length) {
            if (factory.store[produce]) { //factory just finished producing, must be emptied before choosing new produce, then getting filled
                Game.spawns[city].memory.ferryInfo.factoryInfo.transfer.push([produce, 0, factory.store[produce]]);
                return;
            }
            //don't choose new produce if ferry just deposited (ferry will be isNearTo and storeing stuff)
            const ferry = _.find(factory.room.find(FIND_MY_CREEPS), creep => creep.memory.role === "ferry");
            if (ferry && _.sum(Object.values(ferry.store)) > 0 && ferry.pos.isNearTo(factory.pos)) {
                return;
            }
            fact.chooseProduce(factory, city);
            return;
        }
    },
    checkTerminal: function (factory, city) {
        const products = _.filter(Object.keys(COMMODITIES), key => COMMODITIES[key].level === factory.level);
        for (let i = 0; i < products.length; i++) {
            const components = _.without(Object.keys(COMMODITIES[products[i]].components), RESOURCE_ENERGY);
            const rate = fact.findRateLimit(components, products[i]);
            let go = true;
            for (let j = 0; j < components.length; j++) {
                const room = Game.spawns[city].room;
                if ((COMMODITIES[products[i]].components[components[j]] * rate) > room.terminal.store[components[j]]) {
                    go = false;
                }
            }
            if (go) {
                fact.requestComponents(city, components, products[i]);
                Game.spawns[city].memory.ferryInfo.factoryInfo.produce = products[i];
                return true;
            }
        }
    },
    goDormant: function (spawn, factory) {
        spawn.memory.ferryInfo.factoryInfo.produce = "dormant";
        const junk = _.without(Object.keys(factory.store), RESOURCE_ENERGY);
        for (let i = 0; i < junk.length; i++) {
            spawn.memory.ferryInfo.factoryInfo.transfer.push([junk[i], 0, factory.store[junk[i]]]);
        }
    },
    chooseProduce: function (factory, city) {
        const terminal = Game.spawns[city].room.terminal;
        if (!terminal) {
            Game.spawns[city].memory.ferryInfo.factoryInfo.produce = "dormant";
            return;
        }
        if (factory.level >= 1) {
            //check terminal for resources needed to produce same level comms
            if (fact.checkTerminal(factory, city)) {
                return;
            }
            //otherwise go dormant
            fact.goDormant(Game.spawns[city], factory);
        }
        else {
            //make 5k of each base resource commodity (in increments of 200)
            const bars = [RESOURCE_UTRIUM_BAR, RESOURCE_LEMERGIUM_BAR, RESOURCE_ZYNTHIUM_BAR,
                RESOURCE_KEANIUM_BAR, RESOURCE_OXIDANT, RESOURCE_REDUCTANT, RESOURCE_PURIFIER, RESOURCE_GHODIUM_MELT];
            for (let i = 0; i < bars.length; i++) {
                if (terminal.store[bars[i]] < 3000) {
                    Game.spawns[city].memory.ferryInfo.factoryInfo.produce = bars[i];
                    const components = _.without(Object.keys(COMMODITIES[bars[i]].components), RESOURCE_ENERGY); //ferry shouldn't deliver energy
                    fact.requestComponents(city, components, bars[i]);
                    return;
                }
            }
            //if excess base mineral, process it
            for (let i = 0; i < bars.length; i++) {
                const components = _.without(Object.keys(COMMODITIES[bars[i]].components), RESOURCE_ENERGY);
                if (terminal.store[components[0]] >= 9000) {
                    if (components[0] == RESOURCE_GHODIUM && terminal.store[components[0]] < 20000) {
                        continue;
                    }
                    Game.spawns[city].memory.ferryInfo.factoryInfo.produce = bars[i];
                    const coms = _.without(Object.keys(COMMODITIES[bars[i]].components), RESOURCE_ENERGY); //ferry shouldn't deliver energy
                    fact.requestComponents(city, coms, bars[i]);
                    return;
                }
            }
            //make base commodities i.e. wire, cell etc.
            const baseComs = [RESOURCE_CONDENSATE, RESOURCE_ALLOY, RESOURCE_CELL, RESOURCE_WIRE];
            const rawComs = [RESOURCE_SILICON, RESOURCE_METAL, RESOURCE_BIOMASS, RESOURCE_MIST];
            for (let i = 0; i < baseComs.length; i++) {
                const components = _.without(Object.keys(COMMODITIES[baseComs[i]].components), RESOURCE_ENERGY);
                const commodity = _.intersection(components, rawComs)[0];
                if (terminal.store[commodity] >= 1000) {
                    //produce it
                    Game.spawns[city].memory.ferryInfo.factoryInfo.produce = baseComs[i];
                    fact.requestComponents(city, components, baseComs[i]);
                    return;
                }
            }
            //activate dormant mode
            fact.goDormant(Game.spawns[city], factory);
        }
    },
    findRateLimit: function (components, produce) {
        let rateLimit = 0; //determine rate limit(resources cannot be transferred in quantities greater than 1k)
        for (let i = 0; i < components.length; i++) {
            const needed = COMMODITIES[produce].components[components[i]];
            if (rateLimit < needed) {
                rateLimit = needed;
            }
        }
        //use rate limit to determine how much of each component is needed
        const productionNum = _.floor(1000 / rateLimit); //number of cycles we can run per charter
        return productionNum;
    },
    requestComponents: function (city, components, produce) {
        const productionNum = fact.findRateLimit(components, produce);
        for (let i = 0; i < components.length; i++) {
            const requestAmount = COMMODITIES[produce].components[components[i]] * productionNum;
            Game.spawns[city].memory.ferryInfo.factoryInfo.transfer.push([components[i], 1, requestAmount]);
        }
    },
    removeJunk: function (city, terminal) {
        const coms = _.without(_.difference(Object.keys(COMMODITIES), Object.keys(REACTIONS)), RESOURCE_ENERGY);
        const unleveledFactory = _.find(Game.structures, struct => struct instanceof StructureFactory
            && struct.my && !struct.level && struct.room.terminal && struct.room.controller.level >= 7);
        if (!unleveledFactory) {
            return;
        }
        const destination = unleveledFactory.room.name;
        for (let i = 0; i < Object.keys(terminal.store).length; i++) {
            if (_.includes(coms, Object.keys(terminal.store)[i])) {
                //send com to a level 0 room
                Game.spawns[city].memory.ferryInfo.comSend.push([Object.keys(terminal.store)[i], terminal.store[Object.keys(terminal.store)[i]], destination]);
            }
        }
    }
};
var factory = fact;

const rU = {
    // Delete Spawn memory for spawns that no longer exist
    removeOldRoomMemory: function () {
        for (const spawnName in Memory.spawns) {
            if (!Game.spawns[spawnName]) {
                delete Memory.spawns[spawnName];
            }
        }
    },
    isOnEdge: function (pos) {
        return pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
    },
    isNearEdge: function (pos) {
        return pos.x <= 1 || pos.x >= 48 || pos.y <= 1 || pos.y >= 48;
    },
    getWithdrawLocations: function (creep) {
        const city = creep.memory.city;
        const spawn = Game.spawns[city];
        const structures = spawn.room.find(FIND_STRUCTURES);
        return _.filter(structures, structure => structure.structureType == STRUCTURE_CONTAINER ||
            structure.structureType == STRUCTURE_STORAGE ||
            structure.structureType == STRUCTURE_TERMINAL ||
            structure.structureType == STRUCTURE_SPAWN);
    },
    getTransferLocations: function (creep) {
        const city = creep.memory.city;
        const spawn = Game.spawns[city];
        const structures = spawn.room.find(FIND_STRUCTURES);
        return _.filter(structures, structure => structure.structureType == STRUCTURE_STORAGE ||
            //mineral miner error when in use                                        structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_CONTAINER);
    },
    getFactory: function (room) {
        if (room.controller.level < 7)
            return false;
        // check for existing
        const roomCache = utils.getsetd(Cache, room.name, {});
        const factory = Game.getObjectById(roomCache.factory);
        if (factory)
            return factory;
        // look up uncached factory
        const factories = room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_FACTORY }
        });
        if (factories.length) {
            roomCache.factory = factories[0].id;
            return factories[0];
        }
        return false;
    },
    // Get the room's storage location. Priority for storage:
    // 1. Storage 2. Container 3. Terminal 4. Spawn
    getStorage: function (room) {
        // 1. Storage
        if (room.storage)
            return room.storage;
        const roomCache = utils.getsetd(Cache, room.name, {});
        // 2. Container
        const container = Game.getObjectById(roomCache.container);
        if (container)
            return container;
        const structures = room.find(FIND_STRUCTURES);
        const spawn = _.find(structures, struct => struct.structureType == STRUCTURE_SPAWN);
        const newContainer = spawn && _.find(structures, struct => struct.structureType == STRUCTURE_CONTAINER
            && struct.pos.inRangeTo(spawn, 3));
        if (newContainer) {
            roomCache.container = newContainer.id;
            return newContainer;
        }
        // 3. Terminal
        if (room.terminal)
            return room.terminal;
        // 4. Spawn   
        if (spawn)
            return spawn;
        return null;
    },
    getAvailableSpawn: function (spawns) {
        const validSpawns = _.filter(spawns, spawn => !spawn.spawning);
        if (validSpawns.length > 0) {
            return validSpawns[0];
        }
        else {
            return null;
        }
    },
    requestBoosterFill: function (spawn, boosts) {
        if (!spawn.memory.ferryInfo || !spawn.memory.ferryInfo.labInfo) {
            return;
        }
        const receivers = spawn.memory.ferryInfo.labInfo.receivers;
        for (const mineral of boosts) {
            let receiver = _.find(Object.keys(receivers), lab => receivers[lab].boost == mineral);
            if (!receiver) {
                receiver = _.find(Object.keys(receivers), lab => !receivers[lab].boost);
            }
            if (receiver) {
                receivers[receiver].boost = mineral;
                const lab = Game.getObjectById(receiver);
                if (lab) {
                    receivers[receiver].fill = Math.ceil((LAB_MINERAL_CAPACITY - (lab.store[mineral] || 0)) / 1000);
                }
            }
        }
    },
    isNukeRampart: function (roomPos) {
        const structures = roomPos.lookFor(LOOK_STRUCTURES);
        if (_.find(structures, struct => settings_1.nukeStructures.includes(struct.structureType))) {
            return true;
        }
        return false;
    },
    initializeSources: function (spawn) {
        const memory = spawn.memory;
        if (!memory.sources || Object.keys(memory.sources).length == 0) {
            memory.sources = {};
            const localSources = spawn.room.find(FIND_SOURCES);
            _.each(localSources, function (sourceInfo) {
                const sourceId = sourceInfo.id;
                const sourcePos = sourceInfo.pos;
                if (!(sourceId in memory.sources)) {
                    memory.sources[sourceId] = sourcePos;
                }
            });
        }
    }
};
var roomUtils = rU;

const cM = {
    runManager: function (cities) {
        // cache boosts
        utils.cacheBoostsAvailable(cities);
        //group cities by factory level
        const citiesByFactoryLevel = cM.groupByFactoryLevel(cities);
        const levelCache = _.mapValues(citiesByFactoryLevel, utils.empireStore);
        const terminalCache = cM.storeCacheByCity(cities);
        let requestQueue = cM.getTopTier(citiesByFactoryLevel);
        //push all top tier resources into queue
        while (requestQueue.length) {
            const requestedProduct = requestQueue.shift();
            const quantities = cM.getOrderQuantities(requestedProduct);
            const clearedToShip = cM.getOrderStatus(quantities, levelCache);
            if (clearedToShip) {
                //attempt to find a receiver
                const destination = cM.getDestination(requestedProduct, citiesByFactoryLevel);
                if (destination) {
                    //schedule deliveries
                    cM.scheduleDeliveries(citiesByFactoryLevel, destination, terminalCache, quantities, levelCache);
                }
            }
            else {
                //request whatever we're missing
                requestQueue = requestQueue.concat(cM.getMissingComponents(quantities, levelCache));
            }
        }
    },
    getTopTier: function (citiesByFactoryLevel) {
        const levels = Object.keys(citiesByFactoryLevel);
        const topTier = _.max(levels);
        return _.filter(Object.keys(COMMODITIES), c => COMMODITIES[c].level == topTier && cM.isCommodity(c));
    },
    isCommodity: function (commodity) {
        return _.find(Object.keys(COMMODITIES[commodity].components), comp => comp != RESOURCE_ENERGY
            && COMMODITIES[comp]
            && !REACTIONS[comp]
            && _.find(Object.keys(COMMODITIES[comp].components), compComp => compComp != RESOURCE_ENERGY
                && !REACTIONS[compComp]));
    },
    getOrderQuantities: function (product) {
        const compInfo = _.omit(COMMODITIES[product].components, RESOURCE_ENERGY);
        const components = Object.keys(compInfo);
        const rate = factory.findRateLimit(components, product); //find rate limit, and use that to find quantity of each resource needed 
        return _(compInfo).mapValues(amount => amount * rate).value();
    },
    getOrderStatus: function (quantities, levelCache) {
        //bool, check if we have enough of all components to ship
        for (const component of Object.keys(quantities)) {
            const compLvl = COMMODITIES[component].level || 0;
            const cache = levelCache[compLvl];
            const empireHasEnough = cache && cache[component] >= quantities[component];
            if (!empireHasEnough) {
                return false;
            }
        }
        return true;
    },
    getDestination: function (product, citiesByFactoryLevel) {
        //return roomName. destination must have less than 2k of all commodities and correct factoryLevel.
        //console.log(product)
        const prodLvl = COMMODITIES[product].level;
        const components = _.without(Object.keys(COMMODITIES[product].components), RESOURCE_ENERGY);
        const destinations = _.filter(citiesByFactoryLevel[prodLvl], city => _.every(components, comp => !city.terminal.store[comp] || city.terminal.store[comp] < 2000));
        const destination = destinations.length ? _.sample(destinations).name : null;
        return destination;
    },
    getMissingComponents: function (quantities, levelCache) {
        //return array of components that we don't have enough of and are isCommodity
        const missingComponents = [];
        for (const component of Object.keys(quantities)) {
            const compLvl = COMMODITIES[component].level || 0;
            const cache = levelCache[compLvl];
            const empireHasEnough = cache && cache[component] >= quantities[component];
            if (!empireHasEnough && compLvl > 0) {
                missingComponents.push(component);
            }
        }
        return missingComponents;
    },
    storeCacheByCity: function (cities) {
        const termCities = _(cities).filter(city => city.terminal).value();
        return _(termCities)
            .map("name")
            .zipObject(termCities)
            .mapValues(city => _.clone(city.terminal.store))
            .value();
    },
    scheduleDeliveries: function (factCities, destination, terminalCache, quantities, levelCache) {
        for (const component of Object.keys(quantities)) {
            const compLvl = COMMODITIES[component].level || 0;
            const sourceCities = _.shuffle(factCities[compLvl]);
            let quantity = quantities[component];
            for (const source of sourceCities) { //for each city at the relevant level, send resources until the quantity is satisfied
                const memory = Game.spawns[source.memory.city].memory;
                const sourceAmount = terminalCache[source.name][component] || 0;
                if (quantity == 0) {
                    break;
                }
                else if (sourceAmount > 0) {
                    const amount = Math.min(quantity, sourceAmount);
                    // schedule terminal transfer
                    const ferryInfo = utils.getsetd(memory, "ferryInfo", {});
                    const comSend = utils.getsetd(ferryInfo, "comSend", []);
                    comSend.push([component, amount, destination]);
                    // update values to reflect move
                    terminalCache[source.name][component] -= amount;
                    levelCache[compLvl][component] -= amount;
                    terminalCache[destination][component] += amount;
                    quantity -= amount;
                }
            }
            if (quantity) {
                Game.notify("Problem sending " + component + " to " + destination);
            }
        }
    },
    groupByFactoryLevel: function (cities) {
        const citiesWithFactory = _.filter(cities, city => city.terminal && roomUtils.getFactory(city));
        const citiesByFactoryLevel = _.groupBy(citiesWithFactory, (city) => {
            const factory = roomUtils.getFactory(city);
            return factory ? factory.level || 0 : 0;
        });
        return citiesByFactoryLevel;
    },
    cleanCities: function (cities) {
        const citiesByFactoryLevel = cM.groupByFactoryLevel(cities);
        for (const level of Object.values(citiesByFactoryLevel)) {
            for (const c of level) {
                const factoryCity = c;
                const factory = roomUtils.getFactory(factoryCity);
                if (!factory)
                    continue;
                const memory = Game.spawns[factoryCity.memory.city].memory;
                if (memory.ferryInfo.factoryInfo.produce == "dormant") {
                    //empty factory (except for energy)
                    for (const resource of Object.keys(factory.store)) {
                        if (resource != RESOURCE_ENERGY) {
                            memory.ferryInfo.factoryInfo.transfer.push([resource, 0, factory.store[resource]]);
                        }
                    }
                    if (factory.level) { //only leveled factories need to send back components
                        for (const resource of Object.keys(factoryCity.terminal.store)) {
                            //send back components
                            if (COMMODITIES[resource]
                                && !REACTIONS[resource]
                                && resource != RESOURCE_ENERGY
                                && COMMODITIES[resource].level != factory.level) {
                                const comLevel = COMMODITIES[resource].level || 0;
                                const receiverCity = citiesByFactoryLevel[comLevel][0];
                                const receiver = receiverCity.name;
                                const amount = receiverCity.terminal.store[resource];
                                const ferryInfo = utils.getsetd(memory, "ferryInfo", {});
                                const comSend = utils.getsetd(ferryInfo, "comSend", []);
                                comSend.push([resource, amount, receiver]);
                            }
                        }
                    }
                }
            }
        }
    }
};
var commodityManager = cM;

var template = {
    "wallDistance": 4,
    "dimensions": { "x": 13, "y": 11 },
    "centerOffset": { "x": 6, "y": 5 },
    "offset": { "x": 13, "y": 12 },
    "exits": [{ "x": 18, "y": 12 }, { "x": 20, "y": 12 }, { "x": 13, "y": 17 }, { "x": 19, "y": 22 }, { "x": 21, "y": 22 }, { "x": 24, "y": 22 }, { "x": 25, "y": 20 }, { "x": 25, "y": 17 }],
    "buildings": {
        "spawn": {
            "pos": [{ "x": 19, "y": 14 }, { "x": 19, "y": 13 }, { "x": 19, "y": 12 }]
        },
        "storage": { "pos": [{ "x": 19, "y": 16 }] },
        "terminal": { "pos": [{ "x": 20, "y": 17 }] },
        "extension": {
            "pos": [
                { "x": 17, "y": 14 }, { "x": 17, "y": 13 }, { "x": 17, "y": 12 }, { "x": 16, "y": 14 }, { "x": 21, "y": 14 }, { "x": 15, "y": 16 }, { "x": 15, "y": 13 },
                { "x": 14, "y": 14 }, { "x": 16, "y": 12 }, { "x": 15, "y": 12 }, { "x": 14, "y": 12 }, { "x": 13, "y": 12 }, { "x": 13, "y": 13 }, { "x": 13, "y": 14 },
                { "x": 23, "y": 13 }, { "x": 25, "y": 13 }, { "x": 21, "y": 13 }, { "x": 13, "y": 15 }, { "x": 13, "y": 16 }, { "x": 14, "y": 16 }, { "x": 21, "y": 12 },
                { "x": 22, "y": 14 }, { "x": 24, "y": 14 }, { "x": 25, "y": 14 }, { "x": 23, "y": 12 }, { "x": 23, "y": 15 }, { "x": 25, "y": 15 }, { "x": 24, "y": 12 },
                { "x": 25, "y": 12 }, { "x": 22, "y": 12 }, { "x": 23, "y": 16 }, { "x": 24, "y": 16 }, { "x": 25, "y": 16 }, { "x": 23, "y": 17 }, { "x": 13, "y": 18 },
                { "x": 14, "y": 18 }, { "x": 15, "y": 18 }, { "x": 24, "y": 18 }, { "x": 25, "y": 18 }, { "x": 13, "y": 19 }, { "x": 15, "y": 19 }, { "x": 25, "y": 19 },
                { "x": 13, "y": 20 }, { "x": 14, "y": 20 }, { "x": 16, "y": 20 }, { "x": 17, "y": 20 }, { "x": 18, "y": 20 }, { "x": 20, "y": 20 }, { "x": 13, "y": 21 },
                { "x": 15, "y": 21 }, { "x": 17, "y": 21 }, { "x": 19, "y": 21 }, { "x": 25, "y": 21 }, { "x": 13, "y": 22 }, { "x": 14, "y": 22 }, { "x": 15, "y": 22 },
                { "x": 16, "y": 22 }, { "x": 17, "y": 22 }, { "x": 18, "y": 22 }, { "x": 20, "y": 22 }
            ]
        },
        "road": {
            "pos": [
                { "x": 18, "y": 12 }, { "x": 20, "y": 12 }, { "x": 14, "y": 13 }, { "x": 16, "y": 13 }, { "x": 18, "y": 13 }, { "x": 20, "y": 13 }, { "x": 22, "y": 13 }, { "x": 24, "y": 13 },
                { "x": 15, "y": 14 }, { "x": 18, "y": 14 }, { "x": 20, "y": 14 }, { "x": 23, "y": 14 }, { "x": 14, "y": 15 }, { "x": 16, "y": 15 }, { "x": 18, "y": 15 }, { "x": 19, "y": 15 },
                { "x": 20, "y": 15 }, { "x": 22, "y": 15 }, { "x": 24, "y": 15 }, { "x": 17, "y": 16 }, { "x": 18, "y": 16 }, { "x": 20, "y": 16 }, { "x": 21, "y": 16 }, { "x": 13, "y": 17 },
                { "x": 14, "y": 17 }, { "x": 15, "y": 17 }, { "x": 16, "y": 17 }, { "x": 17, "y": 17 }, { "x": 19, "y": 17 }, { "x": 21, "y": 17 }, { "x": 22, "y": 17 }, { "x": 24, "y": 17 },
                { "x": 25, "y": 17 }, { "x": 17, "y": 18 }, { "x": 18, "y": 18 }, { "x": 20, "y": 18 }, { "x": 21, "y": 18 }, { "x": 23, "y": 18 }, { "x": 14, "y": 19 }, { "x": 16, "y": 19 },
                { "x": 18, "y": 19 }, { "x": 19, "y": 19 }, { "x": 20, "y": 19 }, { "x": 21, "y": 19 }, { "x": 24, "y": 19 }, { "x": 15, "y": 20 }, { "x": 19, "y": 20 }, { "x": 22, "y": 20 },
                { "x": 25, "y": 20 }, { "x": 14, "y": 21 }, { "x": 16, "y": 21 }, { "x": 18, "y": 21 }, { "x": 20, "y": 21 }, { "x": 23, "y": 21 }, { "x": 19, "y": 22 }, { "x": 21, "y": 22 },
                { "x": 24, "y": 22 }
            ]
        },
        "lab": {
            "pos": [
                //first two labs must be reactors to be identified properly
                { "x": 22, "y": 21 }, { "x": 23, "y": 20 }, { "x": 22, "y": 19 }, { "x": 23, "y": 19 }, { "x": 21, "y": 20 },
                { "x": 24, "y": 20 }, { "x": 21, "y": 21 }, { "x": 24, "y": 21 }, { "x": 22, "y": 22 }, { "x": 23, "y": 22 }
            ]
        },
        "tower": {
            "pos": [{ "x": 17, "y": 15 }, { "x": 16, "y": 16 }, { "x": 22, "y": 16 }, { "x": 16, "y": 18 }, { "x": 22, "y": 18 }, { "x": 17, "y": 19 }]
        },
        "powerSpawn": { "pos": [{ "x": 18, "y": 17 }] },
        "nuker": { "pos": [{ "x": 15, "y": 15 }] },
        "link": { "pos": [{ "x": 19, "y": 18 }] },
        "observer": { "pos": [{ "x": 25, "y": 22 }] },
        "factory": { "pos": [{ "x": 21, "y": 15 }] }
    },
    "qrCoords": [
        [
            { "x": 0, "y": 0 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 }, { "x": 3, "y": 0 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }, { "x": 6, "y": 0 },
            { "x": 10, "y": 0 }, { "x": 12, "y": 0 }, { "x": 14, "y": 0 }, { "x": 15, "y": 0 }, { "x": 16, "y": 0 }, { "x": 17, "y": 0 }, { "x": 18, "y": 0 }, { "x": 19, "y": 0 },
            { "x": 20, "y": 0 }
        ],
        [
            { "x": 20, "y": 1 }, { "x": 14, "y": 1 }, { "x": 12, "y": 1 }, { "x": 10, "y": 1 }, { "x": 8, "y": 1 }, { "x": 6, "y": 1 }, { "x": 0, "y": 1 }
        ],
        [
            { "x": 0, "y": 2 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 4, "y": 2 }, { "x": 6, "y": 2 }, { "x": 8, "y": 2 }, { "x": 10, "y": 2 }, { "x": 11, "y": 2 }, { "x": 14, "y": 2 },
            { "x": 16, "y": 2 }, { "x": 17, "y": 2 }, { "x": 18, "y": 2 }, { "x": 20, "y": 2 }
        ],
        [
            { "x": 20, "y": 3 }, { "x": 18, "y": 3 }, { "x": 17, "y": 3 }, { "x": 16, "y": 3 },
            { "x": 14, "y": 3 }, { "x": 12, "y": 3 }, { "x": 6, "y": 3 }, { "x": 4, "y": 3 }, { "x": 3, "y": 3 }, { "x": 2, "y": 3 }, { "x": 0, "y": 3 }
        ],
        [
            { "x": 0, "y": 4 }, { "x": 2, "y": 4 },
            { "x": 3, "y": 4 }, { "x": 4, "y": 4 }, { "x": 6, "y": 4 }, { "x": 8, "y": 4 }, { "x": 9, "y": 4 }, { "x": 10, "y": 4 }, { "x": 12, "y": 4 }, { "x": 14, "y": 4 }, { "x": 16, "y": 4 },
            { "x": 17, "y": 4 }, { "x": 18, "y": 4 }, { "x": 20, "y": 4 }
        ],
        [
            { "x": 20, "y": 5 }, { "x": 14, "y": 5 }, { "x": 10, "y": 5 }, { "x": 9, "y": 5 }, { "x": 8, "y": 5 }, { "x": 6, "y": 5 }, { "x": 0, "y": 5 }
        ],
        [
            { "x": 0, "y": 6 }, { "x": 1, "y": 6 }, { "x": 2, "y": 6 }, { "x": 3, "y": 6 }, { "x": 4, "y": 6 }, { "x": 5, "y": 6 }, { "x": 6, "y": 6 }, { "x": 8, "y": 6 },
            { "x": 10, "y": 6 }, { "x": 12, "y": 6 }, { "x": 14, "y": 6 }, { "x": 15, "y": 6 }, { "x": 16, "y": 6 }, { "x": 17, "y": 6 }, { "x": 18, "y": 6 }, { "x": 19, "y": 6 }, { "x": 20, "y": 6 }
        ],
        [
            { "x": 8, "y": 7 }
        ],
        [
            { "x": 0, "y": 8 }, { "x": 1, "y": 8 }, { "x": 3, "y": 8 }, { "x": 6, "y": 8 }, { "x": 7, "y": 8 }, { "x": 10, "y": 8 }, { "x": 11, "y": 8 }, { "x": 12, "y": 8 },
            { "x": 14, "y": 8 }, { "x": 15, "y": 8 }, { "x": 16, "y": 8 }, { "x": 18, "y": 8 }, { "x": 19, "y": 8 }
        ],
        [
            { "x": 20, "y": 9 }, { "x": 19, "y": 9 }, { "x": 18, "y": 9 }, { "x": 17, "y": 9 },
            { "x": 16, "y": 9 }, { "x": 13, "y": 9 }, { "x": 11, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 9 }, { "x": 5, "y": 9 }, { "x": 4, "y": 9 }, { "x": 3, "y": 9 }, { "x": 2, "y": 9 },
            { "x": 2, "y": 9 }, { "x": 1, "y": 9 }, { "x": 0, "y": 9 }
        ],
        [
            { "x": 1, "y": 10 }, { "x": 2, "y": 10 }, { "x": 4, "y": 10 }, { "x": 6, "y": 10 }, { "x": 7, "y": 10 }, { "x": 8, "y": 10 },
            { "x": 9, "y": 10 }, { "x": 11, "y": 10 }, { "x": 12, "y": 10 }, { "x": 17, "y": 10 }, { "x": 18, "y": 10 }, { "x": 20, "y": 10 }
        ],
        [
            { "x": 19, "y": 11 }, { "x": 17, "y": 11 },
            { "x": 16, "y": 11 }, { "x": 14, "y": 11 }, { "x": 12, "y": 11 }, { "x": 7, "y": 11 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 1, "y": 11 }
        ],
        [
            { "x": 0, "y": 12 }, { "x": 1, "y": 12 }, { "x": 2, "y": 12 }, { "x": 5, "y": 12 }, { "x": 6, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 12 }, { "x": 15, "y": 12 },
            { "x": 17, "y": 12 }, { "x": 20, "y": 12 }
        ],
        [
            { "x": 20, "y": 13 }, { "x": 15, "y": 13 }, { "x": 14, "y": 13 }, { "x": 13, "y": 13 }, { "x": 12, "y": 13 }, { "x": 8, "y": 13 }
        ],
        [
            { "x": 0, "y": 14 }, { "x": 1, "y": 14 }, { "x": 2, "y": 14 }, { "x": 3, "y": 14 }, { "x": 4, "y": 14 }, { "x": 5, "y": 14 }, { "x": 6, "y": 14 }, { "x": 8, "y": 14 }, { "x": 9, "y": 14 },
            { "x": 10, "y": 14 }, { "x": 12, "y": 14 }, { "x": 13, "y": 14 }, { "x": 14, "y": 14 }, { "x": 16, "y": 14 }, { "x": 17, "y": 14 }, { "x": 18, "y": 14 }, { "x": 19, "y": 14 }
        ],
        [
            { "x": 20, "y": 15 }, { "x": 19, "y": 15 }, { "x": 17, "y": 15 }, { "x": 10, "y": 15 }, { "x": 6, "y": 15 }, { "x": 0, "y": 15 }
        ],
        [
            { "x": 0, "y": 16 }, { "x": 2, "y": 16 },
            { "x": 3, "y": 16 }, { "x": 4, "y": 16 }, { "x": 6, "y": 16 }, { "x": 12, "y": 16 }, { "x": 13, "y": 16 }, { "x": 16, "y": 16 }
        ],
        [
            { "x": 20, "y": 17 }, { "x": 19, "y": 17 },
            { "x": 18, "y": 17 }, { "x": 17, "y": 17 }, { "x": 16, "y": 17 }, { "x": 13, "y": 17 }, { "x": 12, "y": 17 }, { "x": 11, "y": 17 }, { "x": 10, "y": 17 }, { "x": 9, "y": 17 },
            { "x": 8, "y": 17 }, { "x": 6, "y": 17 }, { "x": 4, "y": 17 }, { "x": 3, "y": 17 }, { "x": 2, "y": 17 }, { "x": 0, "y": 17 }
        ],
        [
            { "x": 0, "y": 18 }, { "x": 2, "y": 18 }, { "x": 3, "y": 18 },
            { "x": 4, "y": 18 }, { "x": 6, "y": 18 }, { "x": 11, "y": 18 }, { "x": 12, "y": 18 }, { "x": 14, "y": 18 }, { "x": 15, "y": 18 }, { "x": 16, "y": 18 }, { "x": 20, "y": 18 }
        ],
        [
            { "x": 16, "y": 19 }, { "x": 15, "y": 19 }, { "x": 13, "y": 19 }, { "x": 10, "y": 19 }, { "x": 9, "y": 19 }, { "x": 8, "y": 19 }, { "x": 6, "y": 19 }, { "x": 0, "y": 19 }
        ],
        [
            { "x": 0, "y": 20 }, { "x": 1, "y": 20 }, { "x": 2, "y": 20 }, { "x": 3, "y": 20 }, { "x": 4, "y": 20 }, { "x": 5, "y": 20 }, { "x": 6, "y": 20 }, { "x": 8, "y": 20 }, { "x": 9, "y": 20 },
            { "x": 11, "y": 20 }, { "x": 15, "y": 20 }, { "x": 17, "y": 20 }, { "x": 19, "y": 20 }
        ]
    ]
};

const m = {
    BoundingBox: class {
        constructor(top, left, bottom, right, thickness = 2) {
            this.top = top; // minY
            this.left = left; // minX
            this.bottom = bottom; // maxY
            this.right = right; // maxX
            this.thickness = thickness;
        }
    },
    //newMove will override all long and short distance motion
    // optional bounding box of form: [top, left, bottom, right]
    newMove: function (creep, endPos, range = 0, avoidEnemies = true, boundingBox = null) {
        //check for cached path and cached route
        const ccache = utils.getCreepCache(creep.id);
        const routeVerified = m.checkRoute(creep, endPos);
        const pathVerified = m.checkPath(creep, endPos);
        //if creep thinks it moved last tick, but pos is the same, it's stuck/needs recalc
        const moveFailed = (ccache.lastPos
            && ccache.lastPos.isEqualTo(creep.pos)
            && ccache.lastMove
            && ccache.lastMove == Game.time - 1);
        //if everything is good to go, MBP
        if (pathVerified && routeVerified && !moveFailed) {
            //check for portals
            if (!ccache.lastPos || ccache.lastPos.roomName == creep.pos.roomName
                || !utils.isIntersection(creep.pos.roomName)) { //if new room is an intersection, check for portals
                const result = creep.moveByPath(ccache.path);
                if (result == OK) {
                    ccache.lastMove = Game.time;
                    ccache.lastPos = creep.pos;
                }
                if ([OK, ERR_TIRED, ERR_BUSY, ERR_NO_BODYPART].includes(result)) { //MBP returns OK, OR a different error that we don't mind (like ERR_TIRED)
                    return;
                }
            }
        }
        //recalc needed
        if (ccache.pathFail >= settings_1.motion.pathFailThreshold) {
            if (Game.time % settings_1.motion.pathFailRetry != 0) {
                return;
            }
            ccache.pathFail = 0;
        }
        const routeFound = m.getRouteAndPath(creep, endPos, avoidEnemies, range, boundingBox);
        if (routeFound) { //if pathing successful, MBP
            if (creep.moveByPath(ccache.path) == OK) {
                ccache.lastMove = Game.time;
                ccache.lastPos = creep.pos;
                const nextPos = ccache.path[0];
                if (Game.rooms[nextPos.roomName]) {
                    const creeps = nextPos.lookFor(LOOK_CREEPS).concat(nextPos.lookFor(LOOK_POWER_CREEPS));
                    if (creeps.length && creeps[0].my && creeps[0].memory.moveStatus != "static") {
                        const scache = utils.getCreepCache(creeps[0].id);
                        if (!scache.lastMove || scache.lastMove < (Game.time - 1)) {
                            creeps[0].move(creeps[0].pos.getDirectionTo(creep.pos));
                        }
                    }
                }
            }
        }
        else {
            if (ccache.pathFail) {
                ccache.pathFail++;
                return;
            }
            ccache.pathFail = 1;
            if (ccache.pathFail > 2) {
                Log.warning(`Pathing failure at ${creep.pos}. Target: ${endPos}. Range: ${range}`);
            }
        }
    },
    //bool, returns success of pathfinding ops
    getRouteAndPath: function (creep, endPos, avoidEnemies, range, boundingBox) {
        const ccache = utils.getCreepCache(creep.id);
        //if creep is in same room as target, path to target. Otherwise, path to nearest exit in the right direction
        const sameRoom = creep.pos.roomName == endPos.roomName;
        if (sameRoom) {
            const maxRooms = 1;
            const goal = { pos: endPos, range: range };
            const result = m.getPath(creep, goal, avoidEnemies, maxRooms, boundingBox);
            if (!result.incomplete) {
                ccache.route = null; //no route since creep is in required room already
                ccache.path = result.path;
                ccache.endPos = endPos;
                return true;
            }
            else {
                return false;
            }
        }
        else {
            const route = m.getRoute(creep.pos.roomName, endPos.roomName, avoidEnemies);
            if (route == ERR_NO_PATH) {
                Log.info(`No route from ${creep.pos} to ${endPos}`);
                return false;
            }
            //we can assume that the route has length 
            //since we already checked to make sure that we are not in the destination room
            //we can also assume that we are outside the first room in the route, since we just recalculated
            let goals;
            if (route.length < 3) {
                goals = { pos: endPos, range: range };
            }
            else {
                const exits = utils.findExitPos(route[1].room, route[2].exit);
                goals = _.map(exits, function (e) {
                    return { pos: e, range: 0 };
                });
            }
            const maxRooms = 16;
            const result = m.getPath(creep, goals, avoidEnemies, maxRooms, boundingBox);
            if (!result.incomplete) {
                ccache.route = route;
                ccache.path = result.path;
                ccache.endPos = endPos;
                return true;
            }
            else {
                return false;
            }
        }
    },
    moveSpeed: function (creep) {
        //if PC, movespeed = 0.1 aka above max
        if (creep instanceof PowerCreep) {
            return 0.001;
        }
        let bodySize = 0;
        if (creep.memory.tug && creep.memory.pullee) {
            const pullee = Game.getObjectById(creep.memory.pullee);
            bodySize = pullee.body.length;
        }
        const moves = creep.getActiveBodyparts(MOVE);
        bodySize += creep.body.length;
        const carries = _.filter(creep.body, part => part.type == CARRY).length; //can't use getActive bc inactive carry parts need to be weightless
        const usedCarries = Math.ceil(creep.store.getUsedCapacity() / CARRY_CAPACITY); //used carries have weight
        const fatigues = bodySize - moves - carries + usedCarries;
        return Math.max(fatigues, 0.001) / Math.max(moves, 0.001);
    },
    findNoviceWallSpots: function (pos, direction, roomName) {
        const wallSpots = [];
        let loopStart = 0;
        let loopEnd = 25;
        let loopVar = "x";
        let constVar = "y";
        switch (direction) {
            case TOP:
                loopStart = 25;
                loopEnd = 50;
                loopVar = "y";
                constVar = "x";
                break;
            case BOTTOM:
                loopStart = 0;
                loopEnd = 25;
                loopVar = "y";
                constVar = "x";
                break;
            case RIGHT:
                loopStart = 0;
                loopEnd = 25;
                loopVar = "x";
                constVar = "y";
                break;
            case LEFT:
                loopStart = 25;
                loopEnd = 50;
                loopVar = "x";
                constVar = "y";
                break;
        }
        for (let i = loopStart; i < loopEnd; i++) {
            const newPos = {};
            newPos[loopVar] = i;
            newPos[constVar] = pos[constVar];
            wallSpots.push(new RoomPosition(newPos.x, newPos.y, roomName));
        }
        return wallSpots;
        //find wall spots in room adjacent to this spot
        // |---------------|    |---------------|
        // | (current room)|    |(x=wallSpot)   |
        // |               |    |               |
        // |               x    xxxxxxxxx       |
        // |               |    |               |
        // |               |    |               |
        // |_______________|    |_______________|
    },
    findNoviceWallRooms: function (room) {
        //return value will be an object, with lists as values for keys
        //check if current room even has novice walls
        const walls = _.filter(room.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_WALL && roomUtils.isOnEdge(s.pos));
        if (!walls.length) {
            return {};
        }
        const noviceWallRooms = {};
        const exits = Game.map.describeExits(room.name);
        for (let i = 0; i < Object.keys(exits).length; i++) {
            const exitRoomName = exits[Object.keys(exits)[i]];
            noviceWallRooms[exitRoomName] = []; //establish keys as neighboring room names
            //find exit points to each room, and scan for walls on the exit
            const exitName = Game.map.findExit(room.name, exitRoomName);
            const exitPositions = room.find(exitName); //list of roomPos on that exit
            let found = 0;
            for (let j = 0; j < exitPositions.length; j++) {
                for (let k = 0; k < walls.length; k++) {
                    if (exitPositions[j].isEqualTo(walls[k].pos)) {
                        //find necessary wallSpots
                        noviceWallRooms[exitRoomName] = (m.findNoviceWallSpots(exitPositions[j], Object.keys(exits)[i], exitRoomName));
                        found++;
                        break;
                    }
                }
                if (found > 1) {
                    break; //no need to loop more than needed, a room won't have more than 2 wall lines
                }
            }
        }
        return noviceWallRooms;
    },
    getPath: function (creep, goals, avoidEnemies, maxRooms, boundingBox) {
        const moveSpeed = m.moveSpeed(creep); //moveSpeed is inverse of fatigue ratio
        const noviceWallRooms = m.findNoviceWallRooms(creep.room);
        //if room is highway with novice walls, make an object with each of the neighboring rooms as keys
        //values should be arrays of locations for walls in those rooms
        const roomDataCache = utils.getsetd(Cache, "roomData", {});
        const result = PathFinder.search(creep.pos, goals, {
            plainCost: Math.ceil(moveSpeed),
            swampCost: Math.ceil(moveSpeed * 5),
            maxRooms: maxRooms,
            maxOps: 10000,
            roomCallback: function (roomName) {
                const roomData = utils.getsetd(roomDataCache, roomName, {});
                if (roomName != creep.pos.roomName && roomData.own && !Memory.settings.allies.includes(roomData.own)
                    && (goals.length || goals.pos.roomName != roomName)
                    && roomData.rcl
                    && CONTROLLER_STRUCTURES[STRUCTURE_TOWER][roomData.rcl]
                    && (!creep.memory.tolerance
                        || creep.memory.tolerance < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][roomData.rcl] * TOWER_POWER_ATTACK - (TOWER_POWER_ATTACK * TOWER_FALLOFF))) {
                    return false;
                }
                if (roomData.skL && roomData.rcl && (goals.length || goals.pos.roomName != roomName))
                    return false;
                if (Game.map.getRoomStatus(roomName).status != "normal") {
                    return false;
                }
                const costs = new PathFinder.CostMatrix;
                if (roomData.skL && roomData.skL.length && !Memory.remotes[roomName] && (goals.length || goals.pos.roomName != roomName)) {
                    const terrain = Game.map.getRoomTerrain(roomName);
                    for (const lairPos of roomData.skL) {
                        const lair = utils.unpackPos(lairPos, roomName);
                        const minX = Math.max(lair.x - 5, 0);
                        const maxX = Math.min(lair.x + 5, 49);
                        const minY = Math.max(lair.y - 5, 0);
                        const maxY = Math.min(lair.y + 5, 49);
                        for (let i = minX; i < maxX; i++) {
                            for (let j = minY; j < maxY; j++) {
                                if (!(terrain.get(i, j) & TERRAIN_MASK_WALL)) {
                                    costs.set(i, j, Math.ceil(250 / Math.min(Math.abs(i - lair.x), Math.abs(j - lair.y))));
                                }
                            }
                        }
                    }
                }
                const room = Game.rooms[roomName];
                if (!room) {
                    if (noviceWallRooms[roomName] && noviceWallRooms[roomName].length) {
                        for (let i = 0; i < noviceWallRooms[roomName].length; i++) {
                            costs.set(noviceWallRooms[roomName][i].x, noviceWallRooms[roomName][i].y, 0xff);
                        }
                        return costs;
                    }
                    //if room is not visible AND is on the novice highway list, set wall spots accordingly
                    return;
                }
                room.find(FIND_STRUCTURES).forEach(function (struct) {
                    if (struct.structureType === STRUCTURE_ROAD || (struct.structureType == STRUCTURE_PORTAL && struct.pos.isEqualTo(goals))) {
                        // Favor roads over plain tiles
                        if (costs.get(struct.pos.x, struct.pos.y) != 0xff) {
                            costs.set(struct.pos.x, struct.pos.y, Math.ceil(moveSpeed / 2));
                        }
                    }
                    else if (struct.structureType !== STRUCTURE_CONTAINER &&
                        (struct.structureType !== STRUCTURE_RAMPART ||
                            !(struct.my || (Memory.settings.allies.includes(struct.owner.username) && struct.isPublic)))) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
                room.find(FIND_MY_CONSTRUCTION_SITES).forEach(function (struct) {
                    if (struct.structureType != STRUCTURE_ROAD && struct.structureType != STRUCTURE_RAMPART && struct.structureType != STRUCTURE_CONTAINER) {
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
                // Avoid creeps in the room
                room.find(FIND_CREEPS).forEach(function (c) {
                    const ccache = utils.getCreepCache(c.id);
                    if (!ccache.lastMove || ccache.lastMove < (Game.time - 1)) {
                        if (!creep.my || creep.memory.moveStatus == "static") {
                            costs.set(c.pos.x, c.pos.y, 0xff);
                        }
                        else {
                            costs.set(c.pos.x, c.pos.y, 30);
                        }
                    }
                    if (c.pos.isEqualTo(goals)) {
                        costs.set(c.pos.x, c.pos.y, 1);
                    }
                });
                room.find(FIND_POWER_CREEPS).forEach(function (c) {
                    c.my ? costs.set(c.pos.x, c.pos.y, 30) : costs.set(c.pos.x, c.pos.y, 0xff);
                });
                if (boundingBox) {
                    m.enforceBoundingBox(costs, boundingBox);
                }
                const goalList = goals.length ? goals : [goals];
                for (const goal of goalList) {
                    if (goal.pos.roomName != roomName)
                        continue;
                    const terrain = Game.map.getRoomTerrain(roomName);
                    const range = goal.range;
                    const minX = Math.max(goal.pos.x - range, 0);
                    const maxX = Math.min(goal.pos.x + range, 49);
                    const minY = Math.max(goal.pos.y - range, 0);
                    const maxY = Math.min(goal.pos.y + range, 49);
                    for (let i = minX; i <= maxX; i++) {
                        if (costs.get(i, minY) < 30 && !(terrain.get(i, minY) & TERRAIN_MASK_WALL))
                            costs.set(i, minY, 1);
                        if (costs.get(i, maxY) < 30 && !(terrain.get(i, maxY) & TERRAIN_MASK_WALL))
                            costs.set(i, maxY, 1);
                    }
                    for (let i = minY; i <= maxY; i++) {
                        if (costs.get(minX, i) < 30 && !(terrain.get(minX, i) & TERRAIN_MASK_WALL))
                            costs.set(minX, i, 1);
                        if (costs.get(maxX, i) < 30 && !(terrain.get(maxX, i) & TERRAIN_MASK_WALL))
                            costs.set(maxX, i, 1);
                    }
                }
                return costs;
            }
        });
        return result;
    },
    enforceBoundingBox: function (costs, boundingBox) {
        const d = boundingBox.thickness; // thickness of barrier
        for (let y = boundingBox.top - d; y <= boundingBox.bottom + d; y++) {
            for (let x = boundingBox.left - d; x <= boundingBox.right + d; x++) {
                const inBox = boundingBox.top <= y && y <= boundingBox.bottom
                    && boundingBox.left <= x && x <= boundingBox.right;
                if (!inBox) {
                    costs.set(x, y, 255);
                }
            }
        }
    },
    getRoute: function (start, finish, avoidEnemies) {
        const roomDataCache = Cache.roomData;
        const route = Game.map.findRoute(start, finish, {
            routeCallback: function (roomName) {
                if (utils.isHighway(roomName)) {
                    return 1;
                }
                if (Game.map.getRoomStatus(roomName).status != "normal") {
                    return Infinity;
                }
                const roomData = utils.getsetd(roomDataCache, roomName, {});
                if (roomData.own && !Memory.settings.allies.includes(roomData.own) && roomData.rcl && CONTROLLER_STRUCTURES[STRUCTURE_TOWER][roomData.rcl] && avoidEnemies) {
                    return 5;
                }
                return settings_1.motion.backRoadPenalty;
            }
        });
        return route;
    },
    checkRoute: function (creep, endPos) {
        const ccache = utils.getCreepCache(creep.id);
        //if creep is already in the same room as destination, route does not need to be checked
        if (ccache.route && endPos.roomName == ccache.route[ccache.route.length - 1].room) {
            return true;
        }
        else if (endPos.roomName == creep.pos.roomName) {
            return true;
        }
        else {
            return false;
        }
    },
    checkPath: function (creep, endPos) {
        const ccache = utils.getCreepCache(creep.id);
        //destination must match destination of cached path
        if (ccache.endPos && endPos.isEqualTo(ccache.endPos)) {
            return true;
        }
        else {
            return false;
        }
    },
    getBoundingBox: function (room) {
        if (!room.memory.plan) {
            return;
        }
        const top = room.memory.plan.y;
        const left = room.memory.plan.x;
        const bottom = top + template.dimensions.y - 1;
        const right = left + template.dimensions.x - 1;
        return new m.BoundingBox(top, left, bottom, right);
    },
    retreat: function (creep, hostiles) {
        const dangerous = _.filter(hostiles, h => h instanceof Structure
            || h instanceof Creep
                && (h.getActiveBodyparts(ATTACK) > 0 || h.getActiveBodyparts(RANGED_ATTACK) > 0));
        const goals = _.map(dangerous, function (d) {
            return { pos: d.pos, range: 8 };
        });
        const retreatPath = PathFinder.search(creep.pos, goals, { maxOps: 200, flee: true, maxRooms: 1,
            roomCallback: function (roomName) {
                const room = Game.rooms[roomName];
                const costs = new PathFinder.CostMatrix;
                room.find(FIND_CREEPS).forEach(function (c) {
                    costs.set(c.pos.x, c.pos.y, 0xff);
                });
                return costs;
            }
        });
        creep.moveByPath(retreatPath.path);
    }
};
var motion = m;

const actions = {
    interact: function (creep, location, fnToTry, range = undefined, logSuccess = false, local = false) {
        const result = fnToTry();
        switch (result) {
            case ERR_NOT_IN_RANGE: {
                const box = local ? motion.getBoundingBox(creep.room) : null;
                motion.newMove(creep, location.pos, range, true, box);
                return null;
            }
            case OK:
                if (logSuccess) {
                    Log.info(creep.name + " at " + creep.pos + ": " + fnToTry.toString());
                }
                return 1;
            case ERR_BUSY:
            case ERR_FULL:
            case ERR_TIRED:
                return result;
            case ERR_NOT_ENOUGH_RESOURCES:
                creep.memory.path = null;
                return result;
            default:
                if (creep.hits == creep.hitsMax) {
                    Log.info(`${creep.memory.role} at ${creep.pos} operating on ${location}: ${result.toString()}`);
                }
                return result;
        }
    },
    reserve: function (creep, target) {
        const city = creep.memory.city;
        if (Game.time % 2000 == 0) {
            return actions.interact(creep, target, () => creep.signController(target, city));
        }
        if (target.room.memory.city != city) {
            creep.room.memory.city = city;
        }
        else {
            return actions.interact(creep, target, () => creep.reserveController(target), 1);
        }
    },
    dismantle: function (creep, target) {
        return actions.interact(creep, target, () => creep.dismantle(target), 1);
    },
    attack: function (creep, target) {
        return actions.interact(creep, target, () => creep.attack(target), 1);
    },
    enablePower: function (creep) {
        return actions.interact(creep, creep.room.controller, () => creep.enableRoom(creep.room.controller), 1);
    },
    usePower: function (creep, target, power) {
        return actions.interact(creep, target, () => creep.usePower(power, target), POWER_INFO[power].range);
    },
    renewPowerCreep: function (creep, target) {
        return actions.interact(creep, target, () => creep.renew(target), 1);
    },
    withdraw: function (creep, location, mineral, amount) {
        if (mineral == undefined) {
            if (!location || !location.store.getUsedCapacity(RESOURCE_ENERGY))
                return ERR_NOT_ENOUGH_RESOURCES;
            return actions.interact(creep, location, () => creep.withdraw(location, RESOURCE_ENERGY), 1);
        }
        else if (amount == undefined) {
            return actions.interact(creep, location, () => creep.withdraw(location, mineral), 1);
        }
        else {
            return actions.interact(creep, location, () => creep.withdraw(location, mineral, amount), 1);
        }
    },
    harvest: function (creep, target) {
        const res = actions.interact(creep, target, () => creep.harvest(target), 1);
        if (res == 1) {
            // Record mining totals in memory for stat tracking
            const works = creep.getActiveBodyparts(WORK);
            if (!creep.memory.mined) {
                creep.memory.mined = 0;
            }
            creep.memory.mined += works;
        }
        return res;
    },
    pick: function (creep, target) {
        return actions.interact(creep, target, () => creep.pickup(target), 1);
    },
    upgrade: function (creep) {
        const location = creep.room.controller;
        return actions.interact(creep, location, () => creep.upgradeController(location), 3);
    },
    charge: function (creep, location, local = false) {
        const store = creep.store;
        if (Object.keys(store).length > 1) {
            const mineral = _.keys(store)[1];
            const result = actions.interact(creep, location, () => creep.transfer(location, mineral), 1, false, local);
            if (result == ERR_INVALID_TARGET)
                return creep.drop(mineral);
        }
        else if (Object.keys(store).length > 0) {
            return actions.interact(creep, location, () => creep.transfer(location, Object.keys(store)[0]), 1, false, local);
        }
    },
    // priorities: very damaged structures > construction > mildly damaged structures
    // stores repair id in memory so it will continue repairing till the structure is at max hp
    build: function (creep) {
        if (Game.time % 200 === 0) {
            creep.memory.repair = null;
            creep.memory.build = null;
        }
        if (creep.memory.repair) {
            const target = Game.getObjectById(creep.memory.repair);
            if (target) {
                if (target.hits < target.hitsMax) {
                    return actions.repair(creep, target);
                }
            }
        }
        const city = creep.memory.city;
        const myRooms = utils.splitRoomsByCity();
        const buildings = _.flatten(_.map(myRooms[city], room => room.find(FIND_STRUCTURES)));
        const needRepair = _.filter(buildings, structure => (structure.hits < (0.2 * structure.hitsMax)) && (structure.structureType != STRUCTURE_WALL) && (structure.structureType != STRUCTURE_RAMPART));
        const walls = _.filter(buildings, structure => (structure.hits < 1000000) && (structure.hits < structure.hitsMax) && (structure.structureType != STRUCTURE_ROAD));
        if (needRepair.length) {
            creep.memory.repair = needRepair[0].id;
            return actions.repair(creep, needRepair[0]);
            //actions.interact(creep, needRepair[0], () => creep.repair(needRepair[0]));
        }
        else {
            const targets = _.flatten(_.map(myRooms[city], room => room.find(FIND_MY_CONSTRUCTION_SITES)));
            //var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                return actions.interact(creep, targets[0], () => creep.build(targets[0]), 3);
            }
            else {
                const damagedStructures = _.filter(buildings, structure => (structure.hits < (0.4 * structure.hitsMax)) && (structure.structureType != STRUCTURE_WALL) && (structure.structureType != STRUCTURE_RAMPART));
                if (damagedStructures.length) {
                    creep.memory.repair = damagedStructures[0].id;
                    return actions.repair(creep, damagedStructures[0]);
                }
                if (walls.length) {
                    const sortedWalls = _.sortBy(walls, structure => structure.hits);
                    creep.memory.repair = sortedWalls[0].id;
                    return actions.repair(creep, sortedWalls[0]);
                }
            }
        }
    },
    repair: function (creep, target) {
        return actions.interact(creep, target, () => creep.repair(target), 3);
    },
    // Pick up stuff lying next to you as you pass by
    notice: function (creep) {
        const tombstones = creep.room.find(FIND_TOMBSTONES);
        const closeStones = _.filter(tombstones, stone => stone.pos.isNearTo(creep.pos));
        if (closeStones.length) {
            // we can only get one thing per turn, success is assumed since we're close
            const result = creep.withdraw(closeStones[0], _.keys(closeStones[0])[0]);
            switch (result) {
                case ERR_FULL:
                    return;
                case ERR_NOT_ENOUGH_RESOURCES:
                    break;
                default:
                    //Log.info(result);
                    return result;
            }
        }
        const resources = _.filter(creep.room.find(FIND_DROPPED_RESOURCES), d => d.resourceType == RESOURCE_ENERGY);
        const closeStuff = _.filter(resources, thing => thing.pos.isNearTo(creep.pos));
        if (closeStuff.length) {
            // we can only get one thing per turn, success is assumed since we're close
            return creep.pickup(closeStuff[0]);
        }
    },
    getBoosted: function (creep) {
        if (creep.spawning) {
            return;
        }
        if (!Game.spawns[creep.memory.city].memory.ferryInfo.labInfo) {
            creep.memory.boosted++;
            return;
        }
        const boosts = { "move": "XZHO2", "tough": "XGHO2", "work": "XZH2O", "heal": "XLHO2", "ranged_attack": "XKHO2" };
        for (let i = creep.body.length - 1; i >= 0; i--) {
            if (!creep.body[i].boost) {
                const type = creep.body[i].type;
                const boost = boosts[type];
                const labs = Object.keys(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers);
                for (const labId of labs) {
                    const lab = Game.getObjectById(labId);
                    if (lab.store[boost] >= LAB_BOOST_MINERAL) {
                        if (!lab.store.energy) {
                            return;
                        }
                        //boost self
                        if (lab.boostCreep(creep) === ERR_NOT_IN_RANGE) {
                            motion.newMove(creep, lab.pos, 1);
                        }
                        return;
                    }
                }
            }
        }
        creep.memory.boosted = true;
        return;
    },
    breakStuff: function (creep) {
        const structures = creep.room.find(FIND_HOSTILE_STRUCTURES);
        const structGroups = _.groupBy(structures, structure => structure.structureType);
        const targetOrder = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_LINK, STRUCTURE_POWER_SPAWN,
            STRUCTURE_EXTRACTOR, STRUCTURE_LAB, STRUCTURE_TERMINAL, STRUCTURE_OBSERVER, STRUCTURE_NUKER, STRUCTURE_STORAGE,
            STRUCTURE_RAMPART];
        for (let i = 0; i < targetOrder.length; i++) {
            const type = targetOrder[i];
            const breakThese = structGroups[type];
            if (breakThese) {
                creep.memory.target = breakThese[0].id;
                return actions.dismantle(creep, breakThese[0]); // TODO break things in your way
            }
        }
    },
    retreat: function (creep) {
        if (Game.time % 20 === 0) {
            creep.memory.retreat = false;
        }
        const checkpoints = creep.memory.checkpoints;
        if (checkpoints) {
            const oldCheckpoint = checkpoints[0];
            const o = oldCheckpoint;
            return motion.newMove(creep, new RoomPosition(o.x, o.y, o.roomName), 0); //creep.moveTo(new RoomPosition(o.x, o.y, o.roomName), {reusePath: 0})
        }
    }
};
var actions_1 = actions;

const rL = {
    // range needed to use these
    UPGRADE: 3,
    SOURCE: 1,
    STORAGE: 1,
    LINK: 1,
    fixCacheIfInvalid: function (room) {
        const rN = room.name;
        if (!Cache[rN])
            Cache[rN] = {};
        const links = Cache[rN].links || {};
        Cache[rN].links = Cache[rN].links || {};
        if (!room.storage)
            return;
        let storageLink = Game.getObjectById(links.store);
        let upgradeLink = Game.getObjectById(links.upgrade);
        let sourceLinks = _.map(links.source, src => Game.getObjectById(src));
        if (storageLink && Game.time % 10 != 0)
            return;
        if (storageLink && upgradeLink && _.reduce(sourceLinks, (l, r) => l && r)
            && sourceLinks.length == 2) {
            return;
        }
        else {
            const memory = Game.spawns[room.memory.city].memory;
            sourceLinks = [];
            for (const source in memory.sources) {
                const linkPos = memory.sources[source][STRUCTURE_LINK + "Pos"];
                if (linkPos) {
                    const look = room.lookForAt(LOOK_STRUCTURES, Math.floor(linkPos / 50), linkPos % 50);
                    for (const result of look) {
                        if (result instanceof StructureLink)
                            sourceLinks.push(result);
                    }
                }
            }
            if (memory.upgradeLinkPos) {
                const look = room.lookForAt(LOOK_STRUCTURES, Math.floor(memory.upgradeLinkPos / 50), memory.upgradeLinkPos % 50);
                for (const result of look) {
                    if (result instanceof StructureLink)
                        upgradeLink = result;
                }
            }
            const structures = room.find(FIND_MY_STRUCTURES);
            storageLink = _.find(structures, struct => struct.structureType == STRUCTURE_LINK
                && struct.pos.inRangeTo(room.storage, 2));
            links.store = storageLink ? storageLink.id : null;
            links.upgrade = upgradeLink ? upgradeLink.id : null;
            links.source = _.map(sourceLinks, link => link ? link.id : null);
            Cache[rN].links = links;
        }
    },
    run: function (room) {
        const rcl = room.controller && room.controller.level;
        if (rcl < 5)
            return;
        rL.fixCacheIfInvalid(room);
        const links = Cache[room.name].links;
        const storageLink = Game.getObjectById(links.store);
        const upgradeLink = Game.getObjectById(links.upgrade);
        const sourceLinks = _.map(links.source, src => Game.getObjectById(src));
        // Make transfers
        for (const sourceLink of sourceLinks) {
            if (!sourceLink || sourceLink.store.getUsedCapacity(RESOURCE_ENERGY) <=
                sourceLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
                continue; // sourceLink isn't full yet
            }
            if (rL.readyForLinkTransfer(sourceLink, upgradeLink)) {
                sourceLink.transferEnergy(upgradeLink);
            }
            else if (rL.readyForLinkTransfer(sourceLink, storageLink)) {
                sourceLink.transferEnergy(storageLink);
            }
        }
        //send from storage link to upgrade link
        if (storageLink && rL.readyForLinkTransfer(storageLink, upgradeLink)) {
            storageLink.transferEnergy(upgradeLink);
        }
    },
    getUpgradeLink: function (room) {
        if (!room.controller)
            return false;
        const spawn = Game.spawns[room.memory.city];
        if (!spawn)
            return false;
        const linkPos = spawn.memory.upgradeLinkPos;
        if (linkPos) {
            const look = room.lookForAt(LOOK_STRUCTURES, Math.floor(linkPos / 50), linkPos % 50);
            for (const result of look) {
                if (result.structureType == STRUCTURE_LINK || result.structureType == STRUCTURE_CONTAINER)
                    return result;
            }
        }
        return false;
    },
    readyForLinkTransfer(sender, receiver) {
        return receiver && !receiver.store.getUsedCapacity(RESOURCE_ENERGY) && !sender.cooldown;
    }
};
var link = rL;

var creepNames = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.cN = void 0;
exports.cN = {
    FERRY_NAME: "ferry",
    DEFENDER_NAME: "defender",
    TRANSPORTER_NAME: "transporter",
    REMOTE_MINER_NAME: "remoteMiner",
    RUNNER_NAME: "runner",
    UPGRADER_NAME: "upgrader",
    BUILDER_NAME: "builder",
    QUAD_NAME: "quad",
    MINERAL_MINER_NAME: "mineralMiner",
    CLAIMER_NAME: "claimer",
    UNCLAIMER_NAME: "unclaimer",
    SPAWN_BUILDER_NAME: "spawnBuilder",
    HARASSER_NAME: "harasser",
    MEDIC_NAME: "medic",
    BREAKER_NAME: "breaker",
    POWER_MINER_NAME: "powerMiner",
    ROBBER_NAME: "robber",
    DEPOSIT_MINER_NAME: "depositMiner",
    SCOUT_NAME: "scout",
    QR_CODE_NAME: "qrCode",
    REPAIRER_NAME: "repairer",
    RESERVER_NAME: "reserver",
    BRICK_NAME: "brick",
    SK_GUARD_NAME: "skGuard",
    getRolePriorities: function () {
        const priorities = {};
        priorities[exports.cN.FERRY_NAME] = 0;
        priorities[exports.cN.DEFENDER_NAME] = 2;
        priorities[exports.cN.TRANSPORTER_NAME] = 1;
        priorities[exports.cN.REMOTE_MINER_NAME] = 3;
        priorities[exports.cN.SK_GUARD_NAME] = 3;
        priorities[exports.cN.RUNNER_NAME] = 2;
        priorities[exports.cN.UPGRADER_NAME] = 5;
        priorities[exports.cN.BUILDER_NAME] = 6;
        priorities[exports.cN.QUAD_NAME] = 3;
        priorities[exports.cN.MINERAL_MINER_NAME] = 8;
        priorities[exports.cN.CLAIMER_NAME] = 9;
        priorities[exports.cN.UNCLAIMER_NAME] = 10;
        priorities[exports.cN.SPAWN_BUILDER_NAME] = 11;
        priorities[exports.cN.HARASSER_NAME] = 3;
        priorities[exports.cN.MEDIC_NAME] = 13;
        priorities[exports.cN.BREAKER_NAME] = 13;
        priorities[exports.cN.POWER_MINER_NAME] = 13;
        priorities[exports.cN.ROBBER_NAME] = 14;
        priorities[exports.cN.DEPOSIT_MINER_NAME] = 15;
        priorities[exports.cN.SCOUT_NAME] = 16;
        priorities[exports.cN.QR_CODE_NAME] = 17;
        priorities[exports.cN.REPAIRER_NAME] = 14;
        priorities[exports.cN.RESERVER_NAME] = 15;
        priorities[exports.cN.BRICK_NAME] = 15;
        return priorities;
    }
};
});

unwrapExports(creepNames);
var creepNames_1 = creepNames.cN;

const sq = {
    schedule: function (spawn, role, boosted = false, flag = null, budget = null, priority = null) {
        sq.initialize(spawn);
        spawn.memory.sq.push({ role: role, boosted: boosted, flag: flag, budget: budget, priority: priority });
    },
    peekNextRole: function (spawn) {
        sq.initialize(spawn);
        return spawn.memory.sq[0];
    },
    removeNextRole: function (spawn) {
        sq.initialize(spawn);
        return spawn.memory.sq.shift();
    },
    getCounts: function (spawn) {
        sq.initialize(spawn);
        return _.countBy(spawn.memory.sq, creep => creep.role);
    },
    countByInfo: function (spawn, role, flag = null) {
        sq.initialize(spawn);
        return _.filter(spawn.memory.sq, creep => creep.role == role && creep.flag == flag).length;
    },
    respawn: function (creep, boosted = false) {
        const spawn = Game.spawns[creep.memory.city];
        if (!spawn)
            return;
        sq.initialize(spawn);
        sq.schedule(spawn, creep.memory.role, boosted, creep.memory.flag);
    },
    initialize: function (spawn) {
        if (!spawn.memory.sq) {
            spawn.memory.sq = [];
        }
    },
    sort: function (spawn) {
        const priorities = creepNames.cN.getRolePriorities();
        const sortFn = (item) => item.priority || priorities[item.role];
        spawn.memory.sq = _.sortBy(spawn.memory.sq, sortFn);
    }
};
var spawnQueue = sq;

const cU = {
    getNextLocation: function (current, locations) {
        return (current + 1) % locations.length;
    },
    updateCheckpoints: function (creep) {
        if (Game.time % 50 == 0 && !utils.enemyOwned(creep.room)) {
            if (creep.hits < creep.hitsMax) {
                return;
            }
            if (!creep.memory.checkpoints) {
                creep.memory.checkpoints = [];
            }
            creep.memory.checkpoints.push(creep.pos);
            if (creep.memory.checkpoints.length > 2) {
                creep.memory.checkpoints.shift();
            }
        }
    },
    getEnergy: function (creep) {
        const location = roomUtils.getStorage(Game.spawns[creep.memory.city].room);
        if (!location || (location.store.energy < 300 && location.room.controller.level > 1) || (location.structureType != STRUCTURE_SPAWN && location.store.energy < 1200)) {
            return;
        }
        if (actions_1.withdraw(creep, location) == ERR_NOT_ENOUGH_RESOURCES) {
            const targets = roomUtils.getWithdrawLocations(creep);
            creep.memory.target = targets[0].id;
        }
    },
    checkRoom: function (creep) {
        if (creep.hits < creep.hitsMax * 0.8) {
            //search for hostile towers. if there are towers, room is enemy
            const tower = _.find(utils.findHostileStructures(creep.room), s => s.structureType == STRUCTURE_TOWER);
            if (tower) {
                if (!Cache[creep.room.name]) {
                    Cache[creep.room.name] = {};
                }
                Cache[creep.room.name].enemy = true;
            }
        }
    },
    logDamage: function (creep, targetPos, rma = false) {
        utils.getsetd(Tmp, creep.room.name, {});
        utils.getsetd(Tmp[creep.room.name], "attacks", []);
        const ranged = creep.getActiveBodyparts(RANGED_ATTACK);
        const damageMultiplier = creep.memory.boosted ? (ranged * 4) : ranged;
        if (rma) {
            for (let i = creep.pos.x - 3; i <= creep.pos.x + 3; i++) {
                for (let j = creep.pos.y - 3; j <= creep.pos.y + 3; j++) {
                    if (i >= 0 && i <= 49 && j >= 0 && j <= 49) {
                        const distance = Math.max(Math.abs(creep.pos.x - i), Math.abs(creep.pos.y - j));
                        switch (distance) {
                            case 0:
                            case 1:
                                Tmp[creep.room.name].attacks.push({ x: i, y: j, damage: damageMultiplier * 10 });
                                break;
                            case 2:
                                Tmp[creep.room.name].attacks.push({ x: i, y: j, damage: damageMultiplier * 4 });
                                break;
                            case 3:
                                Tmp[creep.room.name].attacks.push({ x: i, y: j, damage: damageMultiplier });
                                break;
                        }
                    }
                }
            }
        }
        else {
            Tmp[creep.room.name].attacks.push({ x: targetPos.x, y: targetPos.y, damage: damageMultiplier * RANGED_ATTACK_POWER });
        }
    },
    getCreepDamage: function (creep, type) {
        const creepCache = utils.getCreepCache(creep.id);
        if (creepCache[type + "damage"])
            return creepCache[type + "damage"];
        const damageParts = creep.getActiveBodyparts(type);
        const boostedPart = _.find(creep.body, part => part.type == type && part.boost);
        const multiplier = boostedPart ? BOOSTS[type][boostedPart.boost][type] : 1;
        const powerConstant = type == RANGED_ATTACK ? RANGED_ATTACK_POWER : ATTACK_POWER;
        creepCache[type + "damage"] = powerConstant * multiplier * damageParts;
        return creepCache[type + "damage"];
    },
    generateCreepName: function (counter, role) {
        return role + "-" + counter;
    },
    getGoodPickups: function (creep) {
        const city = creep.memory.city;
        const localCreeps = utils.splitCreepsByCity();
        const miners = _.filter(localCreeps[city], lcreep => lcreep.memory.role == "remoteMiner");
        const drops = _.flatten(_.map(miners, miner => _.filter(miner.room.find(FIND_DROPPED_RESOURCES), d => d.resourceType == RESOURCE_ENERGY)));
        const containers = _.map(miners, miner => _.find(miner.pos.lookFor(LOOK_STRUCTURES), struct => struct.structureType == STRUCTURE_CONTAINER));
        let hostileStorageStructures = [];
        // Only check these occasionally because runners only need to draw them down once
        if (Game.time % 50 == 0)
            hostileStorageStructures = _.flatten(_.map(miners, miner => miner.room.find(FIND_HOSTILE_STRUCTURES, { filter: s => "store" in s })));
        const runnersBySource = _.groupBy(_.filter(localCreeps[city]), c => c.memory.role == "runner", runner => runner.memory.targetId);
        const pickups = drops.concat(containers).concat(hostileStorageStructures);
        return _.filter(pickups, pickup => cU.isGoodPickup(creep, pickup, runnersBySource));
    },
    isGoodPickup: function (creep, pickup, runnersBySource) {
        let amountToPickup = !pickup ? 0 : (pickup instanceof Resource ? pickup.amount : pickup.store.getUsedCapacity());
        // 1. Check it's not storage. Don't want to withdraw from the storage
        const storageId = creep.memory.location;
        if (!pickup || pickup.id == storageId)
            return false;
        // 2. Subtract energy from nearby runners
        if (runnersBySource[pickup.id]) {
            for (const runner of runnersBySource[pickup.id]) {
                amountToPickup -= runner.store.getFreeCapacity();
            }
        }
        // 3. If it is greater than half the creep's capacity, return true
        return amountToPickup >= 0.5 * creep.store.getCapacity();
    },
    getCreepsByRole: function (creeps, role) {
        return _(creeps)
            .filter(creep => creep.memory.role == role)
            .value();
    },
    /// schedules creeps to spawn up until provided quota
    /// param role: role of creep(s) to spawn
    /// param count: number of creeps needed (of this role)
    /// param boosted: whether or not to spawn boosted creeps
    /// param spawn: spawn to spawn from
    /// param currentCreeps: creeps currently in the field (not including spawn queue)
    /// param flag: operation flag used to further filter creeps
    /// param tickOffset: number of ticks of overlap to provide between creeps (i.e if offset is 50, creeps will be scheduled to spawn 50 ticks before the current ones die)
    scheduleIfNeeded: function (role, count, boosted, spawn, currentCreeps, flag = null, tickOffset = 0) {
        const creepsInField = cU.getCreepsByRole(currentCreeps, role);
        const creepsOnOperation = _.filter(creepsInField, creep => creep.memory.flag == flag && !(creep.ticksToLive < tickOffset)).length;
        const queued = spawnQueue.countByInfo(spawn, role, flag);
        let creepsNeeded = count - queued - creepsOnOperation;
        if (role == creepNames.cN.QUAD_NAME) {
            Log.info(`${spawn.name} spawning quad. Queued: ${queued}, OnOp: ${creepsOnOperation}, Needed: ${creepsNeeded} `);
        }
        while (creepsNeeded > 0) {
            spawnQueue.schedule(spawn, role, boosted, flag);
            if (role == creepNames.cN.POWER_MINER_NAME) {
                spawnQueue.schedule(spawn, creepNames.cN.MEDIC_NAME);
            }
            creepsNeeded--;
        }
    },
    maybeBoost(creep) {
        if (creep.memory.needBoost && !creep.memory.boosted) {
            actions_1.getBoosted(creep);
            return true;
        }
        return false;
    }
};
var creepUtils = cU;

const rU$1 = {
    name: creepNames.cN.UPGRADER_NAME,
    type: 6 /* normal */,
    target: 0,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ACID],
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.needBoost && !creep.memory.boosted) {
            rU$1.getBoosted(creep, rU$1.boosts[0]);
            return;
        }
        const creepCache = utils.getCreepCache(creep.id);
        if (!creepCache.works) {
            creepCache.works = creep.getActiveBodyparts(WORK);
        }
        if (creep.store.energy <= creepCache.works)
            rU$1.getEnergy(creep);
        if (creep.store.energy > 0)
            actions_1.upgrade(creep);
        if (Game.time % 50 == 49)
            rU$1.checkConstruction(creep);
    },
    checkConstruction: function (creep) {
        if (!creep.memory.boosted) {
            const extensionSite = _.find(creep.room.find(FIND_MY_CONSTRUCTION_SITES), c => c.structureType == STRUCTURE_EXTENSION
                || c.structureType == STRUCTURE_CONTAINER
                || c.structureType == STRUCTURE_STORAGE);
            if (extensionSite && creep.room.controller.ticksToDowngrade > CONTROLLER_DOWNGRADE[creep.room.controller.level] * 0.8) {
                creep.memory.role = creepNames.cN.BUILDER_NAME;
            }
        }
    },
    getEnergy: function (creep) {
        const link = rU$1.getUpgradeLink(creep);
        if (link) {
            actions_1.withdraw(creep, link);
            if (link && link.structureType == STRUCTURE_CONTAINER && link.pos.isNearTo(creep.pos) && link.pos.inRangeTo(link.room.controller.pos, 3)) {
                creep.move(creep.pos.getDirectionTo(link.pos));
            }
            return;
        }
        creepUtils.getEnergy(creep);
    },
    // Get the upgrade link. Check creep memory, then lib. May return null
    getUpgradeLink: function (creep) {
        let link$1 = Game.getObjectById(creep.memory.upgradeLink);
        link$1 = link$1 || link.getUpgradeLink(creep.room);
        if (link$1) {
            creep.memory.upgradeLink = link$1.id;
            return link$1;
        }
        else {
            return null;
        }
    },
    getBoosted: function (creep, boost) {
        if (creep.spawning) {
            return;
        }
        if (!Game.spawns[creep.memory.city].memory.ferryInfo.labInfo) {
            creep.memory.boosted = true;
            return;
        }
        const labs = Object.keys(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers);
        for (const labId of labs) {
            const lab = Game.getObjectById(labId);
            if (!lab) {
                continue;
            }
            if (lab.mineralType == boost) {
                //boost self
                if (lab.boostCreep(creep) === ERR_NOT_IN_RANGE) {
                    motion.newMove(creep, lab.pos, 1);
                }
                else {
                    creep.memory.boosted = true;
                }
                return;
            }
        }
        creep.memory.boosted = true;
    }
};
var upgrader = rU$1;

const CreepState = {
    START: 1,
    SPAWN: 2,
    ENABLE_POWER: 3,
    WORK_SOURCE: 4,
    WORK_GENERATE_OPS: 5,
    WORK_RENEW: 6,
    WORK_DECIDE: 7,
    WORK_FACTORY: 8,
    WORK_BALANCE_OPS: 9,
    SLEEP: 10,
    WORK_OBSERVER: 11,
    WORK_EXTENSION: 12,
    WORK_SPAWN: 13,
    WORK_CONTROLLER: 14,
    WORK_MINERAL: 15
};
const CS = CreepState;
const rPC = {
    run: function (creep) {
        if (creep.shard)
            creep.memory.shard = creep.shard;
        if (creep.memory.shard && creep.memory.shard != Game.shard.name) {
            return;
        }
        if (creep.ticksToLive == 1) {
            Game.notify(`PC ${creep.name} died in ${creep.room.name}. Last state: ${creep.memory.state}`);
        }
        if (creep.hits < creep.hitsMax && creep.memory.city) {
            creep.moveTo(Game.rooms[creep.memory.city].storage);
            return;
        }
        if (!rPC.hasValidState(creep)) {
            if (creep.ticksToLive > 0) {
                // disabled suicide bc 8 hour delay. creep.suicide()
                return;
            }
            creep.memory.state = CS.START;
        }
        switch (creep.memory.state) {
            case CS.START:
                rPC.initializePowerCreep(creep);
                break;
            case CS.SPAWN:
                rPC.spawnPowerCreep(creep);
                break;
            case CS.ENABLE_POWER:
                actions_1.enablePower(creep);
                break;
            case CS.WORK_SOURCE:
                if (actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_REGEN_SOURCE) == ERR_INVALID_ARGS) {
                    creep.memory.state = CS.ENABLE_POWER;
                }
                break;
            case CS.WORK_GENERATE_OPS:
                creep.usePower(PWR_GENERATE_OPS);
                break;
            case CS.WORK_DECIDE:
                break;
            case CS.WORK_RENEW:
                actions_1.renewPowerCreep(creep, Game.getObjectById(creep.memory.powerSpawn));
                break;
            case CS.WORK_FACTORY:
                actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_OPERATE_FACTORY);
                break;
            case CS.WORK_BALANCE_OPS:
                if (creep.store[RESOURCE_OPS] > POWER_INFO[PWR_OPERATE_FACTORY].ops) {
                    actions_1.charge(creep, creep.room.terminal);
                }
                {
                    actions_1.withdraw(creep, creep.room.terminal, RESOURCE_OPS);
                }
                break;
            case CS.SLEEP:
                break;
            case CS.WORK_OBSERVER:
                actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_OPERATE_OBSERVER);
                break;
            case CS.WORK_EXTENSION:
                actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_OPERATE_EXTENSION);
                break;
            case CS.WORK_SPAWN:
                actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_OPERATE_SPAWN);
                break;
            case CS.WORK_CONTROLLER:
                actions_1.usePower(creep, creep.room.controller, PWR_OPERATE_CONTROLLER);
                break;
            case CS.WORK_MINERAL:
                actions_1.usePower(creep, Game.getObjectById(creep.memory.target), PWR_REGEN_MINERAL);
        }
        creep.memory.state = rPC.getNextState(creep);
    },
    getNextState: function (creep) {
        switch (creep.memory.state) {
            case CS.START:
                return creep.memory.city ? CS.SPAWN : CS.START;
            case CS.SPAWN:
                return (creep.spawnCooldownTime > Date.now()) ? CS.SPAWN : rPC.isPowerEnabled(creep)
                    ? rPC.getNextWork(creep) : CS.ENABLE_POWER;
            case CS.WORK_GENERATE_OPS:
            case CS.WORK_DECIDE:
                return rPC.getNextWork(creep);
            case CS.WORK_BALANCE_OPS:
                return rPC.atTarget(creep) ? CS.SLEEP : CS.WORK_BALANCE_OPS;
            case CS.WORK_RENEW:
            case CS.ENABLE_POWER:
            case CS.WORK_SOURCE:
            case CS.WORK_FACTORY:
            case CS.WORK_OBSERVER:
            case CS.WORK_EXTENSION:
            case CS.WORK_SPAWN:
            case CS.WORK_CONTROLLER:
            case CS.WORK_MINERAL:
                return rPC.atTarget(creep) ? rPC.getNextWork(creep) : creep.memory.state;
            case CS.SLEEP:
                return Game.time % 10 == 0 ? rPC.getNextWork(creep) : CS.SLEEP;
        }
        // If state is unknown then restart
        return CS.START;
    },
    initializePowerCreep: function (creep) {
        if (Game.time % 500 != 0)
            return;
        if (!creep.memory.city) {
            const cities = utils.getMyCities();
            const usedRooms = _(Game.powerCreeps)
                .map(pc => pc.memory.city)
                .value();
            const citiesWithoutAnyPC = _.filter(cities, city => city.controller.level == 8
                && roomUtils.getFactory(city) && !roomUtils.getFactory(city).level
                && !usedRooms.includes(city.name));
            Log.warning(`PowerCreep ${creep.name} is unassigned, please assign using PCAssign(name, city). Available cities on this shard are ${citiesWithoutAnyPC}`);
        }
    },
    spawnPowerCreep: function (creep) {
        // spawn creep
        if (!Game.rooms[creep.memory.city]) {
            Log.error(`PC ${creep.name} is unable to spawn`);
            return;
        }
        const structures = Game.rooms[creep.memory.city].find(FIND_MY_STRUCTURES);
        const powerSpawn = _.find(structures, structure => structure.structureType === STRUCTURE_POWER_SPAWN);
        if (!powerSpawn) {
            return;
        }
        creep.spawn(powerSpawn);
        creep.memory.powerSpawn = powerSpawn.id;
    },
    hasValidState: function (creep) {
        const validSpawn = creep.memory.state == CS.START ||
            creep.memory.state == CS.SPAWN || (creep.room && creep.room.controller);
        const initialized = creep.memory.state && creep.memory.city;
        return initialized && validSpawn;
    },
    atTarget: function (creep) {
        let target;
        let distance = 1;
        switch (creep.memory.state) {
            case CS.WORK_SOURCE:
            case CS.WORK_FACTORY:
            case CS.WORK_OBSERVER:
            case CS.WORK_EXTENSION:
            case CS.WORK_SPAWN:
            case CS.WORK_CONTROLLER:
            case CS.WORK_MINERAL:
                target = Game.getObjectById(creep.memory.target);
                distance = 3;
                break;
            case CS.WORK_BALANCE_OPS:
                target = creep.room.terminal;
                break;
            case CS.ENABLE_POWER:
                target = creep.room.controller;
                break;
            case CS.WORK_RENEW:
                target = Game.getObjectById(creep.memory.powerSpawn);
                break;
        }
        return target && creep.pos.inRangeTo(target, distance);
    },
    /*
     * Get next job. Priorities:
     * 1. Renew (extend life if time to live is low)
     * 2. Generate Ops (generate additional ops to spend on other work)
     * 3. Power sources (power up any source that requires it. Cost 0)
     * 4. Power factories (power a factor. cost 100)
     */
    getNextWork: function (creep) {
        if (creep.ticksToLive < 300)
            return CS.WORK_RENEW;
        if (rPC.canGenerateOps(creep))
            return CS.WORK_GENERATE_OPS;
        if (rPC.hasMineralUpdate(creep))
            return CS.WORK_MINERAL;
        if (rPC.hasSourceUpdate(creep))
            return CS.WORK_SOURCE;
        if (rPC.canOperateFactory(creep))
            return rPC.getOpsJob(creep, PWR_OPERATE_FACTORY, CS.WORK_FACTORY);
        //if (rPC.canOperateObserver(creep)) return rPC.getOpsJob(creep, PWR_OPERATE_OBSERVER, CS.WORK_OBSERVER)
        if (rPC.canOperateExtension(creep))
            return rPC.getOpsJob(creep, PWR_OPERATE_EXTENSION, CS.WORK_EXTENSION);
        if (rPC.canOperateSpawn(creep))
            return rPC.getOpsJob(creep, PWR_OPERATE_SPAWN, CS.WORK_SPAWN);
        if (rPC.canOperateController(creep))
            return rPC.getOpsJob(creep, PWR_OPERATE_CONTROLLER, CS.WORK_CONTROLLER);
        if (rPC.hasExtraOps(creep))
            return CS.WORK_BALANCE_OPS;
        return CS.SLEEP;
    },
    isPowerEnabled: function (creep) {
        const room = Game.rooms[creep.memory.city];
        return (room && room.controller && room.controller.isPowerEnabled);
    },
    canGenerateOps: function (creep) {
        return creep.powers[PWR_GENERATE_OPS] &&
            creep.powers[PWR_GENERATE_OPS].cooldown == 0 &&
            _.sum(creep.store) < creep.store.getCapacity();
    },
    hasMineralUpdate: function (creep) {
        // powerup runs out every 100 ticks
        // if there is no effect on mineral OR effect is running low then choose it
        if (!creep.powers[PWR_REGEN_MINERAL]) {
            return false;
        }
        const mineral = _.find(creep.room.find(FIND_MINERALS));
        if (mineral && (!mineral.effects
            || mineral.effects.length == 0
            || mineral.effects[0].ticksRemaining < 5)) {
            creep.memory.target = mineral.id;
            return true;
        }
        return false;
    },
    hasSourceUpdate: function (creep) {
        const city = creep.memory.city + "0";
        // powerup runs out every 300 ticks
        // get all sources
        // if there is no effect on source then choose it
        if (!creep.powers[PWR_REGEN_SOURCE]) {
            return false;
        }
        const sourceIds = Object.keys(_.filter(Game.spawns[city].memory.sources, s => s.roomName == creep.memory.city));
        for (const sourceId of sourceIds) {
            const source = Game.getObjectById(sourceId);
            if (source && (!source.effects
                || source.effects.length == 0
                || source.effects[0].ticksRemaining < 30)) {
                creep.memory.target = sourceId;
                return true;
            }
        }
        return false;
    },
    canOperateFactory: function (creep) {
        const city = creep.memory.city + "0";
        const spawn = Game.spawns[city];
        const isRunning = spawn && spawn.memory.ferryInfo.factoryInfo.produce !== "dormant";
        const factory = _.find(spawn.room.find(FIND_MY_STRUCTURES), struct => struct.structureType == STRUCTURE_FACTORY);
        const isNew = factory && !factory.level;
        const needsBoost = (factory && factory.cooldown < 30 && isRunning) || isNew;
        return rPC.canOperate(creep, factory, PWR_OPERATE_FACTORY, needsBoost);
    },
    canOperateObserver: function (creep) {
        const city = creep.memory.city + "0";
        const spawn = Game.spawns[city];
        if (!spawn)
            return false;
        const observer = _.find(spawn.room.find(FIND_MY_STRUCTURES), struct => struct.structureType == STRUCTURE_OBSERVER);
        return rPC.canOperate(creep, observer, PWR_OPERATE_OBSERVER, true);
    },
    canOperateExtension: function (creep) {
        const city = creep.memory.city + "0";
        const spawn = Game.spawns[city];
        if (!spawn)
            return false;
        return rPC.canOperate(creep, spawn.room.storage, PWR_OPERATE_EXTENSION, spawn.room.energyAvailable < 0.6 * spawn.room.energyCapacityAvailable);
    },
    canOperateSpawn: function (creep) {
        const spawn = Game.spawns[creep.memory.city + "0"];
        const spawns = spawn && spawn.room.find(FIND_MY_SPAWNS) || [];
        if (spawn && spawn.memory.sq.length > 3 && _.every(spawns, s => s.spawning)) {
            const slowSpawn = _.find(spawns, s => !s.effects || s.effects.length == 0);
            if (slowSpawn) {
                return rPC.canOperate(creep, slowSpawn, PWR_OPERATE_SPAWN, true);
            }
        }
        return false;
    },
    canOperateController: function (creep) {
        if (Game.spawns[creep.memory.city + "0"].memory[upgrader.name] > 0) {
            return rPC.canOperate(creep, Game.spawns[creep.memory.city + "0"].room.controller, PWR_OPERATE_CONTROLLER, true);
        }
        else {
            return false;
        }
    },
    canOperate: function (creep, target, power, extraRequirements) {
        if (target &&
            (!target.effects || target.effects.length == 0) &&
            creep.powers[power] &&
            creep.powers[power].cooldown == 0 && extraRequirements) {
            creep.memory.target = target.id;
            return true;
        }
        return false;
    },
    hasExtraOps: function (creep) {
        return creep.store[RESOURCE_OPS] == creep.store.getCapacity();
    },
    getOpsJob: function (creep, jobName, jobState) {
        return creep.store[RESOURCE_OPS] >= POWER_INFO[jobName].ops ?
            jobState : CS.WORK_BALANCE_OPS;
    }
};
var powerCreep = rPC;

const rMe = {
    name: creepNames.cN.MEDIC_NAME,
    type: 16 /* medic */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
        RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE],
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.needBoost && !creep.memory.boosted) {
            return actions_1.getBoosted(creep);
        }
        rMe.init(creep);
        const partner = Game.getObjectById(creep.memory.partner);
        if (!partner) {
            //if partner is dead, suicide
            if (rMe.endLife(creep)) {
                return;
            }
            //if creep not matched, wait to be picked up
        }
    },
    init: function (creep) {
        if (!creep.memory.partner) {
            creep.memory.partner = null;
        }
    },
    endLife: function (creep) {
        if (creep.memory.partner == null) {
            return false;
        }
        else {
            creep.suicide();
            return true;
        }
    }
};
var medic = rMe;

const T = {
    chooseTarget: function (towers, hostiles, roomName) {
        if (!towers.length) {
            return null;
        }
        const healMap = T.generateHealMap(hostiles);
        for (const hostile of hostiles) {
            if (hostile.pos.x == 49 || hostile.pos.y == 49 || hostile.pos.x == 0 || hostile.pos.y == 49) {
                continue;
            }
            let damage = T.calcTowerDamage(towers, hostile);
            if (Tmp[roomName] && Tmp[roomName].attacks) {
                for (const attack of Tmp[roomName].attacks) {
                    if (hostile.pos.isEqualTo(attack.x, attack.y)) {
                        damage += attack.damage;
                    }
                }
            }
            const heal = T.calcHeal(hostile, healMap);
            if (heal > damage) {
                continue;
            }
            //check creep for boosted tough
            const toughs = T.findToughs(hostile);
            const buffer = toughs * 333.33;
            if (damage < buffer) {
                damage = damage * 0.3;
            }
            else if (buffer) {
                damage = (damage - buffer) + (toughs * 50);
            }
            if (damage > (heal * 1.2) + (hostile.hits * .05)) {
                return hostile;
            }
        }
        //if we make it here, none of the targets could be out gunned
        //shoot randomly every few ticks, maybe mess something up
        if (Game.time % Math.ceil(Math.random() * 20) == 0) {
            return hostiles[Math.floor(Math.random() * hostiles.length)];
        }
        return null;
    },
    calcTowerDamage: function (towers, target) {
        let damage = 0;
        for (const tower of towers) {
            if (tower.store.energy >= TOWER_ENERGY_COST) {
                const distance = tower.pos.getRangeTo(target.pos);
                const damage_distance = Math.max(TOWER_OPTIMAL_RANGE, Math.min(distance, TOWER_FALLOFF_RANGE));
                const steps = TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE;
                const step_size = TOWER_FALLOFF * TOWER_POWER_ATTACK / steps;
                damage += TOWER_POWER_ATTACK - (damage_distance - TOWER_OPTIMAL_RANGE) * step_size;
            }
        }
        return damage;
    },
    findToughs: function (creep) {
        if (creep.className) { //creep is PC
            return 0;
        }
        const toughs = creep.getActiveBodyparts(TOUGH);
        if (toughs == 0) {
            return 0;
        }
        let boosted = false;
        for (let i = 0; i < creep.body.length; i++) {
            if (creep.body[i].type === TOUGH) {
                if (creep.body[i].boost) {
                    boosted = true;
                }
                break;
            }
        }
        if (boosted == true) {
            return toughs;
        }
        else {
            return 0;
        }
    },
    calcHeal: function (creep, healMap) {
        return healMap[creep.pos.x][creep.pos.y];
    },
    generateHealMap: function (hostiles) {
        const map = [];
        for (let i = 0; i < 50; i++) {
            map[i] = [];
            for (let j = 0; j < 50; j++) {
                map[i][j] = 0;
            }
        }
        for (let i = 0; i < hostiles.length; i++) {
            if (hostiles[i].className) { //creep is PC
                continue;
            }
            //check each hostile for heals, and put them at creep's pos
            const heals = hostiles[i].getActiveBodyparts(HEAL);
            if (heals == 0) {
                continue;
            }
            let boostMultiplier = 1;
            //if creep has one heal boosted, assume all are T3 boosted
            for (let j = 0; j < hostiles[i].body.length; j++) {
                if (hostiles[i].body[j].type === HEAL) {
                    if (hostiles[i].body[j].boost) {
                        boostMultiplier = BOOSTS[HEAL][hostiles[i].body[j].boost][HEAL];
                    }
                    break;
                }
            }
            const heal = heals * HEAL_POWER * boostMultiplier;
            for (let j = hostiles[i].pos.x - 3; j <= hostiles[i].pos.x + 3; j++) {
                for (let k = hostiles[i].pos.y - 3; k <= hostiles[i].pos.y + 3; k++) {
                    const range = Math.abs(j - hostiles[i].pos.x) <= 1 && Math.abs(k - hostiles[i].pos.y) <= 1 ? 1 : 3;
                    if (j >= 0 && j <= 49 && k >= 0 && k <= 49) {
                        map[j][k] += (heal / range);
                    }
                }
            }
        }
        return map;
    }
};
var tower_1 = T;

//const sq = require("./spawnQueue"); sq.initialize(Game.spawns['E8N60']); sq.schedule(Game.spawns['E8N60'], 'quad')







const CreepState$1 = {
    START: 1,
    BOOST: 2,
    FORM: 3,
    ENGAGE: 4,
    RALLY: 5,
    DORMANT: 6,
    PRIVATE: 7
};
const CS$1 = CreepState$1;
const rQ = {
    name: creepNames.cN.QUAD_NAME,
    type: 3 /* quad */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
        RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, RESOURCE_CATALYZED_KEANIUM_ALKALIDE],
    /** @param {Creep} creep **/
    run: function (creep) {
        rQ.init(creep);
        switch (creep.memory.state) {
            case CS$1.START:
                //determine whether to get boosted or go form up
                rQ.checkBoost(creep);
                break;
            case CS$1.BOOST:
                if (!creep.memory.boosted) {
                    actions_1.getBoosted(creep);
                }
                else {
                    creep.memory.state = CS$1.FORM;
                }
                //get boosted, then go form up
                break;
            case CS$1.FORM:
                //find a captain
                //if no captain, become one
                //captain finds form up location, jimmys sign up for a jimmy slot, then go brain dead
                //captain checks roster and moves jimmys to necessary positions in formation
                rQ.formUp(creep);
                break;
            case CS$1.ENGAGE:
                rQ.engage(creep);
                break;
            case CS$1.RALLY:
                rQ.rally(creep);
                break;
        }
    },
    init: function (creep) {
        if (!creep.memory.state) {
            creep.memory.state = CS$1.START;
        }
    },
    checkBoost: function (creep) {
        if (creep.memory.needBoost) {
            creep.memory.state = CS$1.BOOST;
        }
        else {
            creep.memory.state = CS$1.FORM;
        }
    },
    reform: function (quad, creep) {
        const matrix = rQ.getRoomMatrix(creep.pos.roomName);
        let formPoint = null;
        let range = 0;
        while (!formPoint) {
            for (let i = Math.max(creep.pos.x - range, 2); i <= Math.min(creep.pos.x + range, 46); i++) {
                for (let j = Math.max(creep.pos.y - range, 2); j <= Math.min(creep.pos.y + range, 46); j++)
                    if (matrix.get(i, j) < 255) {
                        const look = creep.room.lookForAtArea(LOOK_CREEPS, j, i, j + 1, i + 1, true);
                        if (!look.length || !_.find(look, c => !c.creep.my)) {
                            formPoint = new RoomPosition(i, j, creep.pos.roomName);
                            break;
                        }
                    }
                if (formPoint)
                    break;
            }
            range++;
        }
        if (!formPoint) {
            Log.info("no form point");
            return;
        }
        for (let i = 0; i < quad.length; i++) {
            const jimmyPos = new RoomPosition(formPoint.x, formPoint.y, formPoint.roomName);
            switch (i) {
                case 0:
                    break;
                case 1:
                    jimmyPos.y++;
                    break;
                case 2:
                    jimmyPos.x++;
                    jimmyPos.y++;
                    break;
                case 3:
                    jimmyPos.x++;
                    break;
            }
            new RoomVisual(creep.room.name).text(String(i), jimmyPos);
            if (!quad[i].pos.isEqualTo(jimmyPos))
                motion.newMove(quad[i], jimmyPos);
        }
        quad[0].memory.reform = Game.time + 5;
    },
    formUp: function (creep) {
        //maybe creeps could make sure that their entire squad is spawned until determining a captain and forming up, until then
        //they would renew themselves (has to be done before boosting though)
        //form up organization:     C 0
        //(byorder in jimmy list) 1 2
        if (creep.memory.captain) {
            //find meeting position
            //choose an exit, and path as close to room center as possible from that exit. 2nd to last pos on path is rally point
            let formPos = null;
            if (creep.memory.rally) {
                formPos = new RoomPosition(creep.memory.rally.x, creep.memory.rally.y, creep.memory.rally.roomName);
            }
            else {
                const matrix = rQ.getRoomMatrix(creep.pos.roomName);
                let startPos = null;
                const flagName = creep.memory.flag || creep.memory.city + "quadRally";
                let flagRoom = null;
                if (Game.map.getRoomStatus(flagName))
                    flagRoom = flagName;
                if (Memory.flags[flagName])
                    flagRoom = Memory.flags[flagName].roomName;
                if (flagRoom) {
                    const rallyExit = Game.map.findExit(creep.pos.roomName, flagRoom);
                    startPos = _.find(creep.room.find(rallyExit), pos => matrix.get(pos.x, pos.y) == 2);
                }
                else {
                    startPos = _.find(creep.room.find(FIND_EXIT), pos => matrix.get(pos.x, pos.y) == 2);
                }
                const path = PathFinder.search(startPos, { pos: new RoomPosition(25, 25, creep.pos.roomName), range: 1 }, { maxRooms: 1, roomCallback: function () { return matrix; } }).path;
                //TODO: if path is less than 2 in length, find a new startPos and try again
                formPos = path[Math.max(path.length - 2, 0)];
                if (path.length < 2) {
                    const spawn = Game.spawns[creep.memory.city];
                    formPos = new RoomPosition(spawn.pos.x + 1, spawn.pos.y + 4, spawn.pos.roomName);
                }
                creep.memory.rally = formPos;
            }
            let inLine = 0;
            if (!creep.pos.isEqualTo(formPos)) {
                motion.newMove(creep, formPos);
            }
            else {
                inLine++;
            }
            for (let i = 0; i < creep.memory.jimmys.length; i++) {
                const jimmyPos = new RoomPosition(formPos.x, formPos.y, formPos.roomName);
                switch (i) {
                    case 0:
                        jimmyPos.x++;
                        break;
                    case 1:
                        jimmyPos.y++;
                        break;
                    case 2:
                        jimmyPos.x++;
                        jimmyPos.y++;
                        break;
                }
                new RoomVisual(creep.room.name).text(String(i), jimmyPos);
                const jimmy = Game.getObjectById(creep.memory.jimmys[i]);
                if (!jimmy) {
                    continue;
                }
                if (!jimmy.pos.isEqualTo(jimmyPos)) {
                    motion.newMove(jimmy, jimmyPos);
                }
                else {
                    inLine++;
                }
                if (inLine == 4) {
                    creep.memory.state = CS$1.ENGAGE;
                }
            }
            return;
        }
        //find captain
        if (creep.ticksToLive <= 1499) {
            const captain = _.find(creep.room.find(FIND_MY_CREEPS), c => c.memory.captain && c.memory.jimmys.length < 3);
            if (captain) { //sign up as a jimmy and go brain dead
                captain.memory.jimmys.push(creep.id);
                creep.memory.state = CS$1.PRIVATE;
            }
            else { //if no captian, become captain
                creep.memory.captain = true;
                creep.memory.jimmys = [];
            }
        }
    },
    update: function (creep) {
        //generic info gathering at tick start
        const quad = [creep, Game.getObjectById(creep.memory.jimmys[0]),
            Game.getObjectById(creep.memory.jimmys[1]),
            Game.getObjectById(creep.memory.jimmys[2])];
        if (!rQ.allPresent(quad)) { //if quad not fully formed, yolo mode
            rQ.yolo(quad);
            return false;
        }
        for (let i = 0; i < quad.length; i++) {
            if (!Cache[quad[i].room.name] || !Cache[quad[i].room.name].quadMatrix) { //this can be combined with the part where we find enemies
                rQ.getRoomMatrix(quad[i].room.name);
            }
        }
        const everythingByRoom = rQ.splitEverythingByRoom(quad);
        return [quad, everythingByRoom];
    },
    isSafe: function (everythingByRoom, quad /*, destination*/) {
        for (let i = 0; i < quad.length; i++) {
            if (quad[i].hits < quad[i].hitsMax)
                return false;
        }
        const rooms = Object.keys(everythingByRoom);
        for (let i = 0; i < rooms.length; i++) {
            const controller = Game.rooms[rooms[i]].controller;
            if (controller && controller.owner && !Memory.settings.allies.includes(controller.owner.username)) {
                const tower = _.find(everythingByRoom[rooms[i]].structures, struct => struct.structureType == STRUCTURE_TOWER);
                if (tower)
                    return false;
            }
            const hostile = _.find(everythingByRoom[rooms[i]].hostiles, h => (creepUtils.getCreepDamage(h, ATTACK) > 0 || creepUtils.getCreepDamage(h, RANGED_ATTACK) > 0) &&
                h.pos.inRangeTo(quad[0], 3) || h.pos.inRangeTo(quad[1], 3) || h.pos.inRangeTo(quad[2], 3) || h.pos.inRangeTo(quad[3], 3));
            if (hostile)
                return false;
        }
        // const exits = Game.map.describeExits(quad[i].pos.roomName)
        // const nextExit = Game.map.findExit(quad[i].pos.roomName, destination)
        // if(exits[nextExit] == destination && )
        return true;
    },
    rally: function (creep) {
        //move in snake-mode
        const info = rQ.update(creep);
        if (!info)
            return;
        const quad = info[0];
        const everythingByRoom = info[1];
        const flagName = quad[0].memory.flag || quad[0].memory.city + "quadRally";
        let flag = Memory.flags[flagName];
        if (Game.map.getRoomStatus(flagName))
            flag = new RoomPosition(25, 25, flagName);
        if (!flag || !rQ.isSafe(everythingByRoom, quad) || creep.room.name == flag.roomName || utils.getRangeTo(quad[0].pos, flag) < 26) {
            creep.memory.safeTime = Game.time + 20;
            creep.memory.state = CS$1.ENGAGE;
            rQ.engage(creep);
            return;
        }
        const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
        motion.newMove(quad[3], quad[2].pos, 0);
        if (quad[2].pos.inRangeTo(quad[3].pos, 1) || roomUtils.isOnEdge(quad[2].pos))
            motion.newMove(quad[2], quad[1].pos, 0);
        if (quad[1].pos.inRangeTo(quad[2].pos, 1) || roomUtils.isOnEdge(quad[1].pos))
            motion.newMove(quad[1], quad[0].pos, 0);
        if (quad[0].pos.inRangeTo(quad[1].pos, 1) || roomUtils.isOnEdge(quad[0].pos))
            motion.newMove(quad[0], flagPos, 23);
    },
    engage: function (creep) {
        //TODO: check formation status. If formation is broken up, reform
        //if a member has died, go into YOLO mode
        //captain should preemptively send everybody in YOLO mode if it is at 1 ttl
        const info = rQ.update(creep);
        if (!info)
            return;
        const quad = info[0];
        const everythingByRoom = info[1];
        const flagName = quad[0].memory.flag || quad[0].memory.city + "quadRally";
        let flag = Memory.flags[flagName];
        if (Game.map.getRoomStatus(flagName))
            flag = new RoomPosition(25, 25, flagName);
        if (flag && (!creep.memory.safeTime || creep.memory.safeTime < Game.time) && rQ.isSafe(everythingByRoom, quad) && creep.room.name != flag.roomName) {
            creep.memory.state = CS$1.RALLY;
            rQ.rally(creep);
            return;
        }
        const status = rQ.getQuadStatus(quad);
        if (!status)
            rQ.reform(quad, creep);
        const target = Game.getObjectById(creep.memory.target);
        rQ.shoot(everythingByRoom, target);
        let needRetreat = rQ.heal(quad, everythingByRoom); //if below certain health thresholds, we might need to retreat
        if (!needRetreat && status) {
            needRetreat = rQ.checkDamage(quad, everythingByRoom);
        }
        let retreated = false;
        if (needRetreat && status) {
            retreated = rQ.attemptRetreat(quad, everythingByRoom, status);
            //retreat may fail if there is nothing to retreat from
            //although it might be smart to move to a checkpoint if there is nothing to retreat from
        }
        //if we didn't retreat, move to target or rally point
        if (!retreated && status) {
            rQ.advance(creep, quad, everythingByRoom, target, status);
        }
        //auto respawn can be requested directly from quad, but overarching manager should actually make it happen
        // if(creep.ticksToLive == creep.body.length * 12 + 200 && Game.flags[creep.memory.city + "quadRally"]){
        //     rQ.spawnQuad(creep.memory.city)
        // } else if(creep.hits < 200 && Game.flags[creep.memory.city + "quadRally"]){
        //     rQ.spawnQuad(creep.memory.city)
        //     creep.suicide()
        // }
    },
    getDamageMatrix: function (roomName) {
        if (Cache[roomName].damageMatrix) {
            return Cache[roomName].damageMatrix.clone();
        }
        else {
            return false;
        }
    },
    getRoomMatrix: function (roomName) {
        //always return a copy of the room matrix, in case it needs to be modified
        if (!Cache[roomName]) {
            Cache[roomName] = {};
        }
        if (Cache[roomName].quadMatrix && (Game.time % 50 != 0 || !Game.rooms[roomName])) { //if there is a matrix already, just copy and return
            return Cache[roomName].quadMatrix.clone();
        }
        else { //no matrix? make one if we have vision
            if (!Game.rooms[roomName]) {
                return false;
            }
            const damageMatrix = new PathFinder.CostMatrix;
            const costs = new PathFinder.CostMatrix;
            const terrain = new Room.Terrain(roomName);
            //fill matrix with default terrain values
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    switch (terrain.get(i, j)) {
                        case TERRAIN_MASK_WALL:
                            costs.set(i, j, 255);
                            break;
                        case TERRAIN_MASK_SWAMP:
                            costs.set(i, j, 5);
                            break;
                        case 0:
                            costs.set(i, j, 1);
                            break;
                    }
                }
            }
            //if room is visible, fill in structure info
            if (Game.rooms[roomName]) {
                Game.rooms[roomName].find(FIND_STRUCTURES).forEach(function (struct) {
                    if (struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_ROAD &&
                        (struct.structureType !== STRUCTURE_RAMPART ||
                            !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 255);
                    }
                    if (struct.structureType == STRUCTURE_ROAD && costs.get(struct.pos.x, struct.pos.y) != 255) {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    }
                });
                Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).forEach(function (struct) {
                    if (struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_ROAD &&
                        (struct.structureType !== STRUCTURE_RAMPART ||
                            !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 255);
                    }
                    if (struct.structureType == STRUCTURE_ROAD) {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    }
                });
            }
            //loop through everything again, if value of pos is greater than any of the positions TOP, TOP_LEFT or LEFT, then reset those postions to the value of original pos
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    const posCost = costs.get(i, j);
                    if (costs.get(Math.max(0, i - 1), Math.max(0, j - 1)) < posCost) { //TOP_LEFT
                        costs.set(Math.max(0, i - 1), Math.max(0, j - 1), posCost);
                    }
                    if (costs.get(i, Math.max(0, j - 1)) < posCost) { //TOP
                        costs.set(i, Math.max(0, j - 1), posCost);
                    }
                    if (costs.get(Math.max(0, i - 1), j) < posCost) { //LEFT
                        costs.set(Math.max(0, i - 1), j, posCost);
                    }
                    if (roomUtils.isOnEdge(new RoomPosition(i, j, roomName))) {
                        costs.set(i, j, posCost + 1);
                    }
                }
            }
            const towers = _.filter(Game.rooms[roomName].find(FIND_HOSTILE_STRUCTURES), s => s.structureType == STRUCTURE_TOWER);
            if (towers && towers.length) {
                for (let i = 0; i < 50; i++) {
                    for (let j = 0; j < 50; j++) {
                        damageMatrix.set(i, j, tower_1.calcTowerDamage(towers, new RoomPosition(i, j, roomName)));
                    }
                }
            }
            Cache[roomName].damageMatrix = damageMatrix;
            Cache[roomName].quadMatrix = costs;
            return costs.clone();
        }
    },
    yolo: function (quad) {
        for (let i = 0; i < quad.length; i++) {
            if (quad[i]) {
                quad[i].memory.reinforced = true; //keeps quad members from trying to call in a boosted harasser
                quad[i].memory.role = creepNames.cN.HARASSER_NAME;
            }
        }
    },
    allPresent: function (quad) {
        for (let i = 0; i < quad.length; i++) {
            if (!quad[i] || quad[i].ticksToLive == 1) {
                return false;
            }
        }
        return true;
    },
    splitEverythingByRoom: function (quad) {
        const everythingByRoom = {};
        const creepsByRoom = _.groupBy(quad, c => c.pos.roomName);
        for (let i = 0; i < Object.keys(creepsByRoom).length; i++) {
            everythingByRoom[Object.keys(creepsByRoom)[i]] = {};
            everythingByRoom[Object.keys(creepsByRoom)[i]].creeps = creepsByRoom[Object.keys(creepsByRoom)[i]];
        }
        //everyThingByRoom now has keys defined, with creep categories filled
        //now add creeps and structures based on creeps[0] in each room
        const rooms = Object.keys(everythingByRoom);
        for (let i = 0; i < rooms.length; i++) {
            everythingByRoom[rooms[i]].hostiles = utils.findHostileCreeps(Game.rooms[rooms[i]]);
            everythingByRoom[rooms[i]].structures = utils.findHostileStructures(Game.rooms[rooms[i]]);
            rQ.updateMatrices(rooms[i]); //update matrices while we're at it
        }
        return everythingByRoom;
    },
    updateMatrices: function (roomName) {
        if (!Cache[roomName] || !Cache[roomName].quadMatrix) { //update matrices while we're at it
            rQ.getRoomMatrix(roomName);
        }
    },
    findClosestByPath: function (everythingByRoom) {
        const targets = [];
        Object.keys(everythingByRoom).forEach(function (roomName) {
            if (everythingByRoom[roomName].hostiles) {
                const hostiles = _.filter(everythingByRoom[roomName].hostiles, h => !roomUtils.isOnEdge(h.pos)).concat(everythingByRoom[roomName].structures);
                targets.push(everythingByRoom[roomName].creeps[0].pos.findClosestByPath(hostiles));
            }
        });
        if (!targets.length) {
            return null;
        }
        else if (targets.length == 1) {
            return targets[0];
        }
        else {
            return targets[0];
        }
    },
    getDamageTolerance: function (quad) {
        if (!quad[0].memory.tolerance) {
            const heals = quad[0].getActiveBodyparts(HEAL);
            const boostedPart = _.find(quad[0].body, part => part.type == HEAL && part.boost);
            const multiplier = boostedPart ? BOOSTS[HEAL][boostedPart.boost][HEAL] : 1;
            quad[0].memory.tolerance = HEAL_POWER * multiplier * heals * 4;
        }
        return quad[0].memory.tolerance;
    },
    checkDamage: function (quad, everythingByRoom) {
        //return true if there is a melee creep adjacent to any of the quad members
        let damage = rQ.getTowerDamage(quad);
        const tolerance = rQ.getDamageTolerance(quad);
        for (const roomName of Object.values(everythingByRoom)) {
            const melee = _.filter(roomName.hostiles, c => c instanceof Creep && c.getActiveBodyparts(ATTACK));
            const ranged = _.filter(roomName.hostiles, c => c instanceof Creep && c.getActiveBodyparts(RANGED_ATTACK));
            for (const member of roomName.creeps) {
                for (const attacker of melee) {
                    if (member.pos.isNearTo(attacker.pos) || (member.pos.inRangeTo(attacker.pos, 2) && !attacker.fatigue)) {
                        damage += creepUtils.getCreepDamage(attacker, ATTACK);
                    }
                }
                for (const ranger of ranged) {
                    if (member.pos.inRangeTo(ranger.pos, 3) || (member.pos.inRangeTo(ranger.pos, 4) && !ranger.fatigue)) {
                        damage += creepUtils.getCreepDamage(ranger, RANGED_ATTACK);
                    }
                }
            }
        }
        if (damage > tolerance + 100) {
            return true;
        }
        return false;
    },
    advance: function (creep, quad, everythingByRoom, target, status) {
        //if no target, find a target.
        //  a target shouldn't simply be "anything that breathes".
        //  if we aren't in the destination room, a target must be impeding motion to the target room to be considered
        //  if we are in the target room, there should be a certain prioritization to killing essential structures
        //if no viable target found, move to rally flag
        const flagName = quad[0].memory.flag || quad[0].memory.city + "quadRally";
        let flag = Memory.flags[flagName];
        if (Game.map.getRoomStatus(flagName))
            flag = new RoomPosition(25, 25, flagName);
        if (target && roomUtils.isOnEdge(target.pos)) {
            target = null;
        }
        if (!target) {
            if (!flag || Object.keys(everythingByRoom).includes(flag.roomName)) {
                const lookRoom = flag && flag.roomName || creep.pos.roomName;
                const everythingInRoom = everythingByRoom[lookRoom];
                //we are at destination
                target = rQ.chooseNextTarget(everythingInRoom);
            }
        }
        // TODO: Check for creeps in area and react to them. [#153]
        if (!target && creep.memory.targetPos && creep.pos.roomName == creep.memory.targetPos.roomName) {
            creep.memory.targetPos = null;
        }
        if ((target && target.pos) || creep.memory.targetPos) {
            const pos = (target && target.pos) || new RoomPosition(creep.memory.targetPos.x, creep.memory.targetPos.y, creep.memory.targetPos.roomName);
            if (target) {
                creep.memory.targetPos = target.pos;
                creep.memory.target = target.id;
            }
            rQ.move(quad, pos, status, 1);
        }
        else if (flag && !creep.pos.inRangeTo(new RoomPosition(flag.x, flag.y, flag.roomName), 8)) {
            rQ.move(quad, new RoomPosition(flag.x, flag.y, flag.roomName), status, 5);
        }
    },
    // Valuable buildings: everything except walls, ramparts, roads
    // 1. If there are valuable buildings then we need to destroy them
    // 2. Get the target based on the valuable buildings.
    chooseNextTarget: function (everythingInRoom) {
        const valuableStructures = rQ.getValuableStructures(everythingInRoom.structures);
        const creep = everythingInRoom.creeps[0];
        if (valuableStructures.length) {
            return rQ.getTarget(creep, valuableStructures, everythingInRoom.structures);
        }
        if (utils.isSKRoom(creep.room.name)) {
            return rQ.getSKTarget(creep, everythingInRoom.hostiles, everythingInRoom.structures);
        }
        if (everythingInRoom.hostiles.length) {
            return rQ.getTarget(creep, everythingInRoom.hostiles, everythingInRoom.structures);
        }
        if (everythingInRoom.structures.length) {
            return everythingInRoom.structures[0];
        }
        return false;
    },
    getValuableStructures: function (structures) {
        const ignoreStructures = [STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD,
            STRUCTURE_CONTAINER];
        return _(structures)
            .filter(structure => !ignoreStructures.includes(structure.structureType))
            .value();
    },
    getSKTarget: function (creep, hostiles, structures) {
        const sourceKeeper = _.find(hostiles, c => c.owner.username == "Source Keeper");
        if (sourceKeeper) {
            return sourceKeeper;
        }
        //find source keeper spawners
        const sKSpawners = _.filter(structures, s => s.structureType == STRUCTURE_KEEPER_LAIR);
        // sort spawners by respawn time
        const nextSpawn = _.sortBy(sKSpawners, s => s.ticksToSpawn)[0];
        return nextSpawn;
    },
    // Find an attack vector to a building based on the lowest hits required
    getTarget: function (creep, valuableStructures, structures) {
        const result = PathFinder.search(creep.pos, _.map(valuableStructures, function (e) {
            return { pos: e.pos, range: 0 };
        }), {
            plainCost: 1,
            swampCost: 1,
            maxOps: 10000,
            roomCallback: (roomName) => {
                const room = Game.rooms[roomName];
                if (!room || roomName != creep.room.name)
                    return false;
                // 2 times largest building since quad is 2 wide
                const maxHits = 2 * _(structures).max("hits").hits;
                const costs = new PathFinder.CostMatrix;
                // count structure 4 times since quad will hit it in 4 positions
                // the path is relative to the top left creep, __ so a structure in the
                // bottom right needs to be counted against a  _S path through the top left
                for (const structure of structures) {
                    for (const pos of [[0, 0], [0, -1], [-1, 0], [-1, -1]]) {
                        const x = structure.pos.x + pos[0];
                        const y = structure.pos.y + pos[1];
                        const oldCost = costs.get(x, y);
                        const cost = rQ.getCost(structure.hits, maxHits, oldCost);
                        costs.set(x, y, cost);
                    }
                }
                const terrain = new Room.Terrain(roomName);
                for (let i = 0; i < 50; i++) {
                    for (let j = 0; j < 50; j++) {
                        const tile = terrain.get(i, j);
                        const weight = tile & TERRAIN_MASK_WALL ? 255 : 1;
                        costs.set(i, j, Math.max(costs.get(i, j), weight)); //high hp should never be overridden by terrain
                        costs.set(Math.max(i - 1, 0), j, Math.max(costs.get(Math.max(i - 1, 0), j), weight));
                        costs.set(Math.max(i - 1, 0), Math.max(j - 1, 0), Math.max(costs.get(Math.max(i - 1, 0), Math.max(j - 1, 0)), weight));
                        costs.set(i, Math.max(j - 1, 0), Math.max(costs.get(i, Math.max(j - 1, 0)), weight));
                    }
                }
                for (const struct of valuableStructures) { //destinations reset to walkable in case they got labelled as a terrain wall
                    const obstacles = struct.pos.lookFor(LOOK_STRUCTURES);
                    let totalHits = 0;
                    for (const obstacle of obstacles) {
                        totalHits += obstacle.hits;
                    }
                    costs.set(struct.pos.x, struct.pos.y, rQ.getCost(totalHits, maxHits, 1));
                }
                return costs;
            }
        });
        if (result.incomplete || !result.path.length)
            return false;
        const path = result.path;
        const wallInPath = rQ.getWallInQuadPath(creep.room, path);
        if (wallInPath) {
            return wallInPath;
        }
        // if nothing is in our path then return the target at the end of the path
        const targetPos = path.pop();
        const targets = targetPos.lookFor(LOOK_CREEPS).concat(targetPos.lookFor(LOOK_STRUCTURES));
        const target = _(targets).min("hits");
        return target;
    },
    // Find the first wall in our path and select it
    getWallInQuadPath: function (room, path) {
        if (utils.isFriendlyRoom(room))
            return null;
        const blockingStructures = [STRUCTURE_WALL, STRUCTURE_RAMPART];
        return _(path)
            .map(pos => rQ.getOverlappingStructures(room, pos))
            .flatten()
            .find(structure => blockingStructures.includes(structure.structureType));
    },
    getOverlappingStructures: function (room, pos) {
        const quadPoses = [[0, 0], [0, 1], [1, 0], [1, 1]];
        return _(quadPoses)
            .map(quadPos => room.lookForAt(LOOK_STRUCTURES, Math.min(pos.x + quadPos[0], 49), Math.min(pos.y + quadPos[1], 49)))
            .flatten()
            .value();
    },
    // get a score between 1 and 254. 255 is "blocked" & 0 is "free" so we don't want these
    getCost: function (hits, maxHits, oldCost) {
        const ratio = Math.round(255 * hits / maxHits);
        return Math.max(1, Math.min(oldCost + ratio, 254)); // 0 < ratio < 255
    },
    getTowerDamage: function (quad) {
        const matrix = rQ.getDamageMatrix(quad[0].room.name);
        if (matrix) {
            return Math.max(Math.max(matrix.get(quad[0].pos.x, quad[0].pos.y), matrix.get(quad[1].pos.x, quad[1].pos.y)), Math.max(matrix.get(quad[2].pos.x, quad[2].pos.y), matrix.get(quad[3].pos.x, quad[3].pos.y)));
        }
        return 0;
    },
    attemptRetreat: function (quad, everythingByRoom, status) {
        //retreat may fail if there is nothing to retreat from
        //although it might be smart to move to a checkpoint if there is nothing to retreat from
        let allHostiles = [];
        for (let i = 0; i < Object.keys(everythingByRoom).length; i++) {
            allHostiles = allHostiles.concat(Object.values(everythingByRoom)[i].hostiles);
        }
        const dangerous = _.filter(allHostiles, c => !c.level && (c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK)));
        let goals = _.map(dangerous, function (c) {
            return { pos: c.pos, range: 5 };
        });
        let allTowers = [];
        for (const everythingInRoom of Object.values(everythingByRoom)) {
            allTowers = allTowers.concat(_.filter(everythingInRoom.structures, s => s.structureType == STRUCTURE_TOWER));
        }
        goals = goals.concat(_.map(allTowers, function (t) { return { pos: t.pos, range: 20 }; }));
        rQ.move(quad, goals, status, 0, true);
        return true;
    },
    shoot: function (everythingByRoom, target) {
        //prioritize creeps if the target is a structure
        //ignore creeps that are under a ramp
        //and don't forget to RMA when at melee
        //maybe even RMA if total damage dealt will be greater than RA?
        for (const roomName of Object.values(everythingByRoom)) {
            const hostiles = _.filter(roomName.hostiles, hostile => !rQ.isUnderRampart(hostile));
            for (const creep of roomName.creeps) {
                if (_.find(hostiles, h => h.pos.isNearTo(creep.pos))
                    || _.find(roomName.structures, s => s instanceof OwnedStructure && s.hits && s.pos.isNearTo(creep.pos))) {
                    creep.rangedMassAttack();
                    creepUtils.logDamage(creep, creep.pos, true);
                    continue;
                }
                const targetInRange = target && target.pos.inRangeTo(creep.pos, 3);
                if (targetInRange && !(target instanceof Structure) && !rQ.isUnderRampart(target)) {
                    creep.rangedAttack(target);
                    creepUtils.logDamage(creep, target.pos);
                    continue;
                }
                const newTarget = _.find(hostiles, h => h.pos.inRangeTo(creep.pos, 3));
                if (newTarget) {
                    creep.rangedAttack(newTarget);
                    creepUtils.logDamage(creep, newTarget.pos);
                    continue;
                }
                if (targetInRange && target instanceof Structure) {
                    creep.rangedAttack(target);
                    creepUtils.logDamage(creep, target.pos);
                    continue;
                }
                const structureTarget = _.find(roomName.structures, h => h.pos.inRangeTo(creep.pos, 3));
                if (structureTarget) {
                    creep.rangedAttack(structureTarget);
                    creepUtils.logDamage(creep, structureTarget.pos);
                }
            }
        }
    },
    isUnderRampart: function (creep) {
        const structures = creep.pos.lookFor(LOOK_STRUCTURES);
        if (structures.length) {
            for (let i = 0; i < structures.length; i++) {
                if (structures[i].structureType == STRUCTURE_RAMPART) {
                    return true;
                }
            }
        }
        return false;
    },
    heal: function (quad, everythingByRoom) {
        //return true if a retreat is needed
        let hostiles = [];
        for (const roomName of Object.values(everythingByRoom)) {
            hostiles = hostiles.concat(roomName.hostiles);
        }
        const damaged = _.min(quad, "hits");
        if (damaged.hits < damaged.hitsMax * 0.9) {
            for (let i = 0; i < quad.length; i++) {
                quad[i].heal(damaged);
            }
        }
        else if (hostiles.length || damaged.hits < damaged.hitsMax) {
            for (let i = 0; i < quad.length; i++) {
                quad[i].heal(quad[i]);
            }
        }
        if (damaged.hits < damaged.hitsMax * 0.85) {
            return true;
        }
        return false;
    },
    moveByPath: function (leader, quad, path, status) {
        for (let i = 0; i < quad.length; i++) {
            if (quad[i].fatigue || !quad[i].getActiveBodyparts(MOVE)) {
                return;
            }
        }
        let direction = null;
        if (leader.pos.isNearTo(path[0])) {
            direction = leader.pos.getDirectionTo(path[0]);
        }
        else {
            for (let i = 0; i < path.length; i++) {
                if (leader.pos.isEqualTo(path[i]) && i < path.length - 1) {
                    direction = path[i].getDirectionTo(path[i + 1]);
                    break;
                }
            }
        }
        if (direction) {
            if (status.roomEdge && Math.abs(direction - status.roomEdge) == 4) {
                return; //if quad wants to move against the grain on exit, stay still
            }
            for (let i = 0; i < quad.length; i++) {
                quad[i].move(direction);
            }
        }
        else if (!status.roomEdge && (Game.cpu.bucket > 9000 || _.find(quad, c => c.hits < c.hitsMax))) { //if not moving do an idle dance?
            const nextLocation = Math.floor(Math.random() * 3) + 1; //1, 2, or 3
            for (let i = 0; i < quad.length; i++) {
                let nextCreep = i + nextLocation;
                if (nextCreep >= quad.length) {
                    nextCreep -= quad.length;
                }
                direction = quad[i].pos.getDirectionTo(quad[nextCreep]);
                quad[i].move(direction);
            }
        }
    },
    longRangeToLocal: function (quad, leader, target) {
        const route = Game.map.findRoute(leader.pos.roomName, target.roomName, {
            routeCallback(roomName) {
                let returnValue = 2;
                if (Game.map.getRoomStatus(roomName).status != "normal") {
                    returnValue = Infinity;
                }
                else {
                    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                    const isHighway = (parseInt(parsed[1]) % 10 === 0) ||
                        (parseInt(parsed[2]) % 10 === 0);
                    const isMyRoom = Game.rooms[roomName] &&
                        Game.rooms[roomName].controller &&
                        Game.rooms[roomName].controller.my;
                    if (isHighway || isMyRoom) {
                        returnValue = 1;
                    }
                    else if (Cache[roomName] && Cache[roomName].enemy) {
                        returnValue = 20;
                    }
                    else {
                        returnValue = 2;
                    }
                }
                if (rQ.getRoomMatrix(roomName)) {
                    returnValue = returnValue * 0.8;
                }
                return returnValue;
            }
        });
        if (route == -2) {
            return null;
        }
        for (let i = 0; i < route.length; i++) {
            if (!rQ.getRoomMatrix(route[i].room)) {
                const start = route[i - 1] && route[i - 1].room || leader.pos.roomName;
                const exits = utils.findExitPos(start, route[i].exit);
                const goals = _.map(exits, function (exit) {
                    return { pos: exit, range: 0 };
                });
                return goals;
            }
        }
        //if we don't have a creep in the required room, we need to move to route[0]
        for (let i = 0; i < quad.length; i++) {
            if (quad[i].pos.roomName == target.roomName) { //we are already in required room
                return null;
            }
        }
    },
    move: function (quad, target, status, range, retreat = false) {
        if (!range) {
            range = 0;
        }
        let destination = null;
        if (!retreat) {
            const newTarget = rQ.longRangeToLocal(quad, status.leader, target);
            if (newTarget) {
                destination = newTarget;
            }
            else {
                destination = { pos: target, range: range };
            }
        }
        else {
            destination = target;
        }
        if (range == 1) {
            range = 2;
            if (status.leader.pos.inRangeTo(target, 2)
                && _.every(quad, member => !member.pos.isNearTo(target))) {
                range = 1;
            }
        }
        const search = PathFinder.search(status.leader.pos, destination, {
            maxRooms: 4,
            flee: retreat,
            roomCallback: function (roomName) {
                const costs = rQ.getRoomMatrix(roomName);
                if (!costs) {
                    return false;
                }
                const damageMatrix = rQ.getDamageMatrix(roomName);
                if (status.roomEdge) {
                    //if formation is on a roomEdge, and any of members is in a room but not on it's edge, we cannot move into that room
                    //unless they are all in that room
                    for (let i = 0; i < quad.length; i++) { //save a little cpu by not using a room we can't move into anyway
                        if (!status.sameRoom && status.leader.pos.roomName != roomName && quad[i].pos.roomName == roomName && !roomUtils.isOnEdge(quad[i].pos)) {
                            return false;
                        }
                    }
                    //otherwise, if this is leader's room, block necessary positions to limit motion in appropriate fashion
                    //see: getQuadStatus()
                    const leader = status.leader;
                    for (let i = -1; i < 2; i++) {
                        for (let j = -1; j < 2; j++) {
                            if (leader.pos.x + i > 0 && leader.pos.x + i < 50 && leader.pos.y + j > 0 && leader.pos.y + j < 50) {
                                const direction = leader.pos.getDirectionTo(new RoomPosition(leader.pos.x + i, leader.pos.y + j, roomName));
                                const tolerance = 1;
                                if (Math.abs(direction - status.roomEdge) != 4 && Math.abs(direction - status.roomEdge) > tolerance && ( Math.abs(direction - status.roomEdge) != 7)) {
                                    //because TOP == 1 and TOP_LEFT == 8, a difference of 7 actually signals adjacency
                                    //unwalkable
                                    costs.set(leader.pos.x + i, leader.pos.y + j, 255);
                                }
                            }
                        }
                    }
                }
                if (Game.rooms[roomName]) {
                    //if we have vision, add creeps to matrix, otherwise just return it plain
                    const quadNames = [];
                    for (let i = 0; i < quad.length; i++) {
                        quadNames.push(quad[i].id);
                    }
                    for (const creep of Game.rooms[roomName].find(FIND_CREEPS)) {
                        if (!_(quad).find(member => member.pos.inRangeTo(creep.pos, 8))
                            || (!Memory.settings.allies.includes(creep.owner.username) && !_(quad).find(member => member.pos.inRangeTo(creep.pos, 3)))) {
                            continue;
                        }
                        if (!quadNames.includes(creep.id)) {
                            //quad cannot move to any pos that another creep is capable of moving to
                            const attackThreat = creepUtils.getCreepDamage(creep, ATTACK) > rQ.getDamageTolerance(quad);
                            const offset = attackThreat && !creep.fatigue ? 3 :
                                attackThreat ? 2 : 1;
                            for (let i = Math.max(0, creep.pos.x - offset); i < Math.min(50, creep.pos.x + offset); i++) {
                                for (let j = Math.max(0, creep.pos.y - offset); j < Math.min(50, creep.pos.y + offset); j++) {
                                    costs.set(i, j, 255);
                                }
                            }
                        }
                    }
                }
                //factor in tower damage
                //TODO: include creep damage as well
                if (damageMatrix) {
                    const healPower = status.leader.getActiveBodyparts(HEAL) * 48;
                    for (let i = 0; i < 50; i++) {
                        for (let j = 0; j < 50; j++) {
                            const damage = damageMatrix.get(i, j);
                            if (damage > healPower) {
                                costs.set(i, j, costs.get(i, j) + damage - healPower);
                            }
                        }
                    }
                }
                //if retreating, block off exits
                if (retreat) {
                    for (let i = 0; i < 50; i++) {
                        costs.set(i, 0, 255);
                        costs.set(i, 48, 255);
                        costs.set(0, i, 255);
                        costs.set(48, i, 255);
                    }
                }
                return costs;
            }
        });
        if (search.incomplete) ;
        rQ.moveByPath(status.leader, quad, search.path, status);
    },
    getQuadStatus: function (quad) {
        //we need to know which creep is in which position because all pathfinding must be done based on the creep in the top left
        //roomEdge status determines which directions we can move
        //For Example: if roomEdge status == RIGHT && creeps are not all in the same room, we can only move RIGHT,
        //however, if creeps are all in the same room, we can move RIGHT, TOP_RIGHT, or BOTTOM_RIGHT
        //halting on a roomEdge will always result in the edge flipping the following tick i.e. if roomEdge == RIGHT, next tick it'll be LEFT
        let leader = null;
        let highRoom = []; //creeps that are in the leftmost or topmost room of creeps in squad
        for (let i = 0; i < quad.length; i++) { //if a creep's room is higher than any other squad member's room, it must be in the highest room
            const coords = utils.roomNameToPos(quad[i].pos.roomName);
            for (let j = 0; j < quad.length; j++) {
                const compCoords = utils.roomNameToPos(quad[j].pos.roomName);
                if (coords[0] < compCoords[0] || coords[1] > compCoords[1]) {
                    highRoom.push(quad[i]);
                    break;
                }
            }
        }
        //if highRoom is empty, all creeps are in highRoom
        if (!highRoom.length) {
            highRoom = quad;
        }
        //amongst creeps in highroom, find toppest leftest one
        for (let i = 0; i < highRoom.length; i++) {
            let topLeft = true;
            for (let j = 0; j < highRoom.length; j++) { //if creep is not top, left, or top left of every other creep, it is not the leader
                if (highRoom[j].pos.getDirectionTo(highRoom[i]) != LEFT
                    && highRoom[j].pos.getDirectionTo(highRoom[i]) != TOP_LEFT
                    && highRoom[j].pos.getDirectionTo(highRoom[i]) != TOP
                    && !highRoom[j].pos.isEqualTo(highRoom[i])) {
                    topLeft = false;
                }
            }
            if (topLeft) {
                leader = highRoom[i];
                break;
            }
        }
        //determine roomEdge status
        let roomEdge = null; //default is null, if we are not on an edge it should stay that way
        for (let i = 0; i < quad.length; i++) {
            if (roomUtils.isOnEdge(quad[i].pos)) { //if a creep from the squad is on an edge, it can determine which edge we are on
                if (quad[i].pos.x == 49) {
                    roomEdge = LEFT;
                }
                else if (quad[i].pos.x == 0) {
                    roomEdge = RIGHT;
                }
                else if (quad[i].pos.y == 49) {
                    roomEdge = TOP;
                }
                else {
                    roomEdge = BOTTOM;
                }
                break;
            }
        }
        if (!leader)
            return null;
        if (!roomEdge)
            for (let i = 0; i < quad.length; i++)
                for (let j = i; j < quad.length; j++)
                    if (!quad[i].pos.isNearTo(quad[j].pos))
                        return null;
        if (roomEdge && quad[0].memory.reform && quad[0].memory.reform > Game.time) {
            return null;
        }
        const result = {};
        result.leader = leader;
        result.roomEdge = roomEdge;
        //if all of the creeps in the squad are in the highest room, they must all be in the same room
        result.sameRoom = highRoom.length >= quad.length;
        return result;
    }
};
var quad = rQ;

const rBr = {
    name: creepNames.cN.BREAKER_NAME,
    type: 15 /* breaker */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
        RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ACID],
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.needBoost && !creep.memory.boosted) {
            return actions_1.getBoosted(creep);
        }
        creepUtils.updateCheckpoints(creep);
        rBr.init(creep);
        const medic = Game.getObjectById(creep.memory.medic);
        if (!medic) {
            if (rBr.endLife(creep)) {
                return;
            }
            else {
                rBr.medicSearch(creep);
                return;
            }
        }
        //breaker has a medic
        const canMove = rBr.canMove(creep, medic);
        let target = Game.getObjectById(creep.memory.target);
        const targetFlag = Memory.flags[creep.memory.city + "breakTarget"];
        if (targetFlag) {
            if (Game.rooms[targetFlag.roomName]) {
                const structures = Game.rooms[targetFlag.roomName].lookForAt(LOOK_STRUCTURES, targetFlag.x, targetFlag.y);
                if (structures.length) {
                    target = structures[0];
                }
                else {
                    delete Memory.flags[creep.memory.city + "breakTarget"];
                }
            }
        }
        //attempt to break target,
        //if target is not in range and there is another valid target in range, break new valid target
        //if target cannot be pathed to, choose new target to be saved as target
        rBr.breakStuff(creep, target);
        if (!rBr.maybeRetreat(creep, medic, canMove)) {
            rBr.advance(creep, medic, target, canMove);
        }
        rBr.heal(creep, medic);
    },
    init: function (creep) {
        //initialize memory
        if (!creep.memory.medic) {
            creep.memory.medic = null;
        }
    },
    endLife: function (creep) {
        // if creep had a medic but no longer does then suicide
        if (creep.memory.medic) {
            creep.suicide();
            return true;
        }
        return false;
    },
    medicSearch: function (creep) {
        //find single medics in your neighborhood
        const creeps = creep.room.find(FIND_MY_CREEPS);
        let medic$1;
        if (creep.memory.boosted && creep.memory.role == rBr.name) {
            medic$1 = _.find(creeps, c => c.memory.role == medic.name && !c.memory.partner && c.memory.boosted);
        }
        else {
            medic$1 = _.find(creeps, c => c.memory.role == medic.name && !c.memory.partner && !c.memory.needBoost);
        }
        if (medic$1) {
            medic$1.memory.partner = creep.id;
            creep.memory.medic = medic$1.id;
        }
    },
    canMove: function (creep, medic) {
        //can only move if both creeps are not fatigued OR one of the creeps is on a room edge
        if ((creep.pos.isNearTo(medic) && !creep.fatigue && !medic.fatigue) || roomUtils.isOnEdge(creep.pos) || roomUtils.isOnEdge(medic.pos)) {
            return true;
        }
        else {
            return false;
        }
    },
    breakStuff: function (creep, target) {
        if (target && target.pos.isNearTo(creep.pos)) {
            creep.dismantle(target);
            return;
            // if next to target, break it
        }
        // if next to enemy structure, break it
        if (creep.room.controller && (creep.room.controller.owner && Memory.settings.allies.includes(creep.room.controller.owner.username)
            || creep.room.controller.reservation && Memory.settings.allies.includes(creep.room.controller.reservation.username)))
            return;
        const structures = creep.room.lookForAtArea(LOOK_STRUCTURES, Math.max(0, creep.pos.y - 1), Math.max(0, creep.pos.x - 1), Math.min(49, creep.pos.y + 1), Math.min(49, creep.pos.x + 1), true); //returns an array of structures
        if (structures.length) {
            creep.dismantle(structures[0].structure);
        }
    },
    maybeRetreat: function (creep, medic, canMove) {
        const checkpoint = creep.memory.checkpoints && new RoomPosition(creep.memory.checkpoints[0].x, creep.memory.checkpoints[0].y, creep.memory.checkpoints[0].roomName);
        if (!creep.memory.tolerance) {
            const heals = medic.getActiveBodyparts(HEAL);
            creep.memory.tolerance = HEAL_POWER * (creep.memory.boosted ? heals * BOOSTS[HEAL][RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE][HEAL] : heals);
        }
        //retreat if necessary
        //if retreating, determine when it is safe to resume attack
        //possibly use avoid towers
        const hostiles = utils.findHostileCreeps(creep.room);
        let damage = 0;
        const duo = [creep, medic];
        const melee = _.filter(hostiles, c => c instanceof Creep && c.getActiveBodyparts(ATTACK));
        const ranged = _.filter(hostiles, c => c instanceof Creep && c.getActiveBodyparts(RANGED_ATTACK));
        for (const member of duo) {
            for (const attacker of melee) {
                if (member.pos.isNearTo(attacker.pos) || (member.pos.inRangeTo(attacker.pos, 2) && !attacker.fatigue)) {
                    damage += creepUtils.getCreepDamage(attacker, ATTACK);
                }
            }
            for (const ranger of ranged) {
                if (member.pos.inRangeTo(ranger.pos, 3) || (member.pos.inRangeTo(ranger.pos, 4) && !ranger.fatigue)) {
                    damage += creepUtils.getCreepDamage(ranger, RANGED_ATTACK);
                }
            }
        }
        if ((damage > creep.memory.tolerance || creep.hits < creep.hitsMax * .9 || medic.hits < medic.hitsMax * .9) && checkpoint && canMove) {
            motion.newMove(medic, checkpoint, 1);
            rBr.medicMove(medic, creep);
            return true;
        }
        return false;
    },
    advance: function (creep, medic, target, canMove) {
        if (!canMove && !medic.pos.isNearTo(creep)) {
            medic.moveTo(creep, { range: 1 });
            return;
        }
        if (!canMove)
            return;
        if (target) {
            if (target.pos.isNearTo(creep)) {
                return; //nothing to do if already at target
            }
            if (creep.moveTo(target, { range: 1 }) == ERR_NO_PATH) {
                //no path to target => find new target
                rBr.findTarget(creep, medic);
                return;
            }
            rBr.medicMove(creep, medic); //move medic
            return;
        }
        //find new target or follow rally path
        rBr.findTarget(creep, medic);
        // TODO if no target, follow rally path, and attempt to acquire targets along the way
        //if breaker peeks into a room and there is no clear path to every exit,
        // clear a path to every exit before continuing the rally
    },
    getTarget: function (creep, valuableStructures, structures) {
        const result = PathFinder.search(creep.pos, _.map(valuableStructures, function (e) {
            return { pos: e.pos, range: 0 };
        }), {
            plainCost: 1,
            swampCost: 1,
            maxRooms: 1,
            roomCallback: (roomName) => {
                const maxHits = _(structures).max("hits").hits;
                const costs = new PathFinder.CostMatrix;
                // count structure 4 times since quad will hit it in 4 positions
                // the path is relative to the top left creep, __ so a structure in the
                // bottom right needs to be counted against a  _S path through the top left
                const terrain = new Room.Terrain(roomName);
                for (const structure of structures) {
                    const oldCost = costs.get(structure.pos.x, structure.pos.y);
                    const cost = quad.getCost(structure.hits, maxHits, oldCost);
                    costs.set(structure.pos.x, structure.pos.y, cost);
                    if (terrain.get(structure.pos.x, structure.pos.y) & TERRAIN_MASK_WALL)
                        costs.set(structure.pos.x, structure.pos.y, 254); //targettable but otherwise essentially impassable
                }
                const creeps = Game.rooms[roomName].find(FIND_CREEPS);
                for (const c of creeps) {
                    costs.set(c.pos.x, c.pos.y, 255);
                }
                return costs;
            }
        });
        if (result.incomplete)
            return false;
        const path = result.path;
        const wallInPath = rBr.getWallInPath(path);
        if (wallInPath) {
            return wallInPath;
        }
        // if nothing is in our path then return the target at the end of the path
        const targetPos = path.pop();
        if (!targetPos)
            return false;
        const targets = targetPos.lookFor(LOOK_STRUCTURES);
        const target = _(targets).min("hits");
        return target;
    },
    getWallInPath: function (path) {
        const blockingStructures = [STRUCTURE_WALL, STRUCTURE_RAMPART];
        return _(path)
            .map(pos => pos.lookFor(LOOK_STRUCTURES))
            .flatten()
            .find(structure => blockingStructures.includes(structure.structureType));
    },
    findTarget: function (creep, medic) {
        const flag = creep.memory.city + "break";
        const structures = creep.room.find(FIND_STRUCTURES, {
            filter: structure => structure.hits &&
                (!(structure instanceof OwnedStructure) || !Memory.settings.allies.includes(structure.owner.username))
        });
        if (!Memory.flags[flag] || creep.pos.roomName == Memory.flags[flag].roomName) {
            //we are in destination room, target "valuable" structures
            const valuableStructures = quad.getValuableStructures(structures);
            if (valuableStructures.length) {
                const target = rBr.getTarget(creep, valuableStructures, structures);
                if (!target)
                    return;
                creep.memory.target = target.id;
                return;
            }
            if (structures.length) {
                const target = rBr.getTarget(creep, structures, structures);
                if (!target)
                    return;
                creep.memory.target = target.id;
                return;
            }
        }
        if (Memory.flags[flag] && creep.room.name == Memory.flags[flag].roomName && !structures.length) {
            return;
        }
        //if in a friendly room or my room, ignore structures and rally. Else, set nearest structure as target
        if (creep.room.controller && creep.room.controller.owner
            && (Memory.settings.allies.includes(creep.room.controller.owner.username)
                || creep.room.controller.my)) {
            rBr.rally(creep, medic, flag);
        }
        else {
            rBr.rally(creep, medic, flag); //no valid targets, attempt to continue rally
        }
    },
    rally: function (creep, medic, flagName) {
        const flag = Memory.flags[flagName];
        if (flag && creep.room.name != flag.roomName) {
            motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName), 24);
            rBr.medicMove(creep, medic);
        }
    },
    medicMove: function (creep, medic) {
        if (medic.pos.isNearTo(creep.pos)) {
            medic.move(medic.pos.getDirectionTo(creep));
        }
        else {
            motion.newMove(medic, creep.pos, 1);
        }
    },
    heal: function (creep, medic) {
        //placeholder logic
        //if creep is in an owned room, heal. Else, only heal if hurt
        if (creep.pos.roomName == medic.pos.roomName) {
            if (medic.hits < 0.6 * medic.hitsMax) {
                medic.heal(medic);
            }
            else if (creep.hits < creep.hitsMax) {
                medic.heal(creep);
            }
            else if (medic.hits < medic.hitsMax) {
                medic.heal(medic);
            }
            else if (medic.room.controller && medic.room.controller.owner && !medic.room.controller.my) {
                medic.heal(medic);
            }
        }
        else {
            medic.heal(medic);
        }
    }
};
var breaker = rBr;

const rPM = {
    name: creepNames.cN.POWER_MINER_NAME,
    type: 17 /* powerMiner */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_UTRIUM_ACID],
    run: function (creep) {
        creepUtils.checkRoom(creep); //check if in hostile room
        if (!rPM.getBoosted(creep, rPM.boosts)) {
            return;
        }
        const medic = Game.getObjectById(creep.memory.medic);
        if (!medic) {
            if (breaker.endLife(creep)) {
                return;
            }
            else {
                breaker.medicSearch(creep);
                return;
            }
        }
        const flagName = creep.memory.flag || creep.memory.city + "powerMine";
        if (!Memory.flags[flagName]) {
            creep.suicide();
            medic.suicide();
            return;
        }
        if (creep.hits < creep.hitsMax / 2 || medic.hits < medic.hitsMax / 2) { //temp drop operation if under attack
            delete Memory.flags[flagName];
            creep.suicide();
            medic.suicide();
            return;
        }
        const canMove = breaker.canMove(creep, medic);
        let bank = Game.getObjectById(creep.memory.target); //target is pBank
        if (!bank)
            bank = rPM.findBank(creep, flagName);
        const flag = Memory.flags[flagName];
        if (!flag)
            return;
        if (!bank && flag.roomName != creep.pos.roomName) {
            if (canMove) {
                motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName), 1);
            }
            breaker.medicMove(creep, medic);
            return;
        }
        if (!bank) {
            rPM.retreat(creep, medic, flagName);
            return;
        }
        const hostile = rPM.roomScan(creep);
        if (hostile && (hostile.pos.inRangeTo(medic.pos, 3) || hostile.pos.inRangeTo(creep.pos, 3))) {
            if (!creep.memory.reinforced) {
                const harassFlag = utils.generateFlagName(creep.memory.city + "harass");
                Memory.flags[harassFlag] = new RoomPosition(25, 25, creep.room.name);
                creep.memory.reinforced = true;
            }
            creep.attack(hostile);
            breaker.heal(creep, medic);
            if (canMove)
                motion.newMove(creep, hostile.pos, 0);
            breaker.medicMove(creep, medic);
            return;
        }
        rPM.hitBank(creep, medic, bank, canMove);
        if (!canMove && !medic.pos.isNearTo(creep.pos)) {
            breaker.medicMove(creep, medic);
        }
    },
    hitBank: function (creep, medic, bank, canMove) {
        if (canMove && !bank.pos.isNearTo(creep.pos)) {
            motion.newMove(creep, bank.pos, 1);
            breaker.medicMove(creep, medic);
        }
        if (bank.pos.isNearTo(creep.pos)) {
            if (creep.hits == creep.hitsMax)
                creep.attack(bank);
            medic.heal(creep);
        }
        rPM.summonRunners(creep, bank);
    },
    retreat: function (creep, medic, flagName) {
        if (creep.pos.inRangeTo(new RoomPosition(Memory.flags[flagName].x, Memory.flags[flagName].y, Memory.flags[flagName].roomName), 4)) {
            breaker.medicMove(medic, creep);
            motion.newMove(medic, new RoomPosition(25, 25, creep.pos.roomName), 5);
        }
    },
    summonRunners: function (creep, bank) {
        if (!bank) {
            return;
        }
        if (!creep.memory.bankInfo) {
            creep.memory.bankInfo = {};
            let damage = creep.getActiveBodyparts(ATTACK) * ATTACK_POWER;
            if (creep.memory.boosted) {
                damage = damage * BOOSTS[ATTACK][RESOURCE_CATALYZED_UTRIUM_ACID][ATTACK];
            }
            else if (PServ) {
                damage = damage * 2;
            }
            const runnersNeeded = Math.ceil(bank.power / 1600);
            const route = motion.getRoute(Game.spawns[creep.memory.city].pos.roomName, bank.pos.roomName, true);
            if (route == -2) {
                Log.error(`PowerMiner ${creep.name} at ${creep.pos} unable to find route`);
                return;
            }
            const distance = route.length * 50;
            const summonTime = distance + (Math.ceil(runnersNeeded / CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][8]) * MAX_CREEP_SIZE * CREEP_SPAWN_TIME);
            creep.memory.bankInfo.summonHits = summonTime * damage;
            creep.memory.bankInfo.runnersNeeded = runnersNeeded;
        }
        if (Game.time % 15 == 1 && bank.hits < creep.memory.bankInfo.summonHits) {
            const localCreeps = utils.splitCreepsByCity()[creep.memory.city];
            const localSpawn = Game.spawns[creep.memory.city];
            creepUtils.scheduleIfNeeded(creepNames.cN.RUNNER_NAME, creep.memory.bankInfo.runnersNeeded, false, localSpawn, localCreeps, creep.memory.flag);
        }
    },
    findBank: function (creep, flagName) {
        const flag = Memory.flags[flagName];
        if (flag && Game.rooms[flag.roomName]) {
            const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
            const bank = flagPos.lookFor(LOOK_STRUCTURES);
            if (bank.length) {
                creep.memory.target = bank[0].id;
                return bank[0];
            }
            else {
                //if no bank, move away
                const look = flagPos.look();
                if (look.length < 2) { //terrain always shows up, so if there is anything else there, leave the flag on
                    delete Memory.flags[flagName];
                }
            }
        }
        return null;
    },
    roomScan: function (creep) {
        if (!creep.memory.aware && Game.time % 5 != 0) {
            return null;
        }
        const hostiles = _.filter(creep.room.find(FIND_HOSTILE_CREEPS), c => Memory.settings.allies.includes(creep.owner.username)
            && c.pos.inRangeTo(creep.pos, 9)
            && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0 || c.pos.isNearTo(creep.pos)));
        if (!hostiles.length) {
            creep.memory.aware = false;
            return null;
        }
        creep.memory.aware = true;
        const closestHostile = creep.pos.findClosestByRange(hostiles);
        return closestHostile;
    },
    attackHostiles: function (creep, bank, hostiles) {
        if (creep && bank && hostiles)
            return;
    },
    getBoosted: function (creep, boosts) {
        const alreadyBoosted = creep.memory.boosted && creep.memory.boosted >= boosts.length;
        if (!creep.memory.needBoost || alreadyBoosted) {
            return true;
        }
        if (!creep.memory.boosted) {
            creep.memory.boosted = 0;
        }
        const boost = boosts[creep.memory.boosted];
        if (creep.spawning) {
            return;
        }
        if (!Game.spawns[creep.memory.city].memory.ferryInfo.labInfo) {
            creep.memory.boosted++;
            return;
        }
        const labs = Object.keys(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers);
        for (const labId of labs) {
            const lab = Game.getObjectById(labId);
            if (!lab) {
                continue;
            }
            const type = utils.getTypeFromBoost(boost);
            const unboosted = _.filter(creep.body, p => p.type == type && !p.boost).length;
            const boostNeeded = LAB_BOOST_MINERAL * unboosted;
            if (lab.mineralType == boost && lab.store[lab.mineralType] >= LAB_BOOST_MINERAL) {
                //boost self
                if (lab.boostCreep(creep) === ERR_NOT_IN_RANGE) {
                    motion.newMove(creep, lab.pos, 1);
                }
                else if (lab.store[lab.mineralType] >= boostNeeded) {
                    creep.memory.boosted++;
                }
                return;
            }
        }
    }
};
var powerMiner = rPM;

const rDM = {
    name: creepNames.cN.DEPOSIT_MINER_NAME,
    type: 24 /* depositMiner */,
    target: 0,
    boosts: [RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_CATALYZED_KEANIUM_ACID],
    // Keep track of how much is mined for stats. Stat object will clear this when it's recorded
    mined: 0,
    run: function (creep) {
        creepUtils.checkRoom(creep);
        if (_.sum(Object.values(creep.store)) === 0 && creep.ticksToLive < 500) { //if old and no store, suicide
            creep.suicide();
            return;
        }
        if (!powerMiner.getBoosted(creep, rDM.boosts)) {
            return;
        }
        if (creep.memory.mode === 0) {
            if (_.sum(Object.values(creep.store)) === creep.store.getCapacity()) {
                creep.memory.mode = 1;
            }
        }
        switch (creep.memory.mode) {
            case 0: {
                //newly spawned or empty store
                const flagName = creep.memory.flag;
                const flag = Memory.flags[flagName];
                if (!flag) { //if there is no flag, change city.memory.depositMiner to 0, and suicide
                    creep.suicide();
                    return;
                }
                const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
                if (creep.body.length === 3) {
                    delete Memory.flags[flagName];
                    return;
                }
                if (flagPos.roomName !== creep.pos.roomName) { //move to flag until it is visible
                    motion.newMove(creep, flagPos, 1);
                    return;
                }
                const deposit = Game.rooms[flagPos.roomName].lookForAt(LOOK_DEPOSITS, flagPos); //if flag is visible, check for deposit, if no deposit, remove flag
                if (!deposit.length) {
                    delete Memory.flags[flagName];
                    return;
                }
                if (_.sum(Object.values(creep.store)) === 0 && (deposit[0].lastCooldown > 25 && Game.cpu.bucket < settings_1.bucket.resourceMining)) {
                    delete Memory.flags[flagName];
                    return;
                }
                //check for enemies. if there is an enemy, call in harasser
                rDM.checkEnemies(creep, deposit[0]);
                //move towards and mine deposit (actions.harvest)
                if (actions_1.harvest(creep, deposit[0]) === 1) {
                    //record amount harvested
                    let works = _.filter(creep.body, part => part.type == WORK).length;
                    if (creep.memory.boosted) {
                        works = works * BOOSTS.work[RESOURCE_CATALYZED_UTRIUM_ALKALIDE].harvest;
                    }
                    // record personal work for stats
                    if (!creep.memory.mined) {
                        creep.memory.mined = 0;
                    }
                    creep.memory.mined += works;
                    // update harvest total tracker for planning purposes
                    if (!Memory.flags[creep.memory.flag])
                        break;
                    if (!Memory.flags[creep.memory.flag].harvested)
                        Memory.flags[creep.memory.flag].harvested = 0;
                    Memory.flags[creep.memory.flag].harvested += works;
                }
                break;
            }
            case 1:
                //store is full
                if (_.sum(Object.values(creep.store)) === 0) {
                    creep.memory.mode = 0;
                    return;
                }
                actions_1.charge(creep, Game.spawns[creep.memory.city].room.storage);
        }
    },
    checkEnemies: function (creep, deposit) {
        if (Game.time % 5 == 0 || creep.hits < creep.hitsMax) {
            //scan room for hostiles
            const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
            if (rDM.checkAllies(creep, hostiles)) {
                return;
            }
            const dangerous = _.find(hostiles, h => h.getActiveBodyparts(ATTACK) > 0 || h.getActiveBodyparts(RANGED_ATTACK) > 0);
            //check for tampering with deposit
            const cooldown = deposit.lastCooldown;
            const expected = Math.ceil(0.001 * Math.pow(Memory.flags[creep.memory.flag].harvested, 1.2));
            if (cooldown > expected) {
                Memory.flags[creep.memory.flag].harvested = Math.ceil(Math.pow((deposit.lastCooldown / 0.001), 1 / 1.2));
            }
            if (cooldown > expected || dangerous) {
                //call in harasser
                const flagName = utils.generateFlagName(creep.memory.city + "harass");
                if (!_.find(Object.keys(Memory.flags), flag => Memory.flags[flag].roomName == creep.room.name && flag.includes("harass")))
                    utils.placeFlag(flagName, new RoomPosition(25, 25, creep.room.name));
            }
        }
    },
    checkAllies: function (creep, hostiles) {
        const owners = _.map(hostiles, hostile => hostile.owner.username);
        const ally = _.find(owners, owner => {
            Cache.enemies = Cache.enemies || {};
            Cache.enemies[owner] = Cache.enemies[owner] || 0;
            Cache.enemies[owner]++;
            return Memory.settings.allies.includes(owner);
        });
        if (ally) {
            //remove flag
            const flag = Memory.flags[creep.memory.flag];
            const allies = _.filter(creep.room.find(FIND_HOSTILE_CREEPS), c => Memory.settings.allies.includes(c.owner.username));
            for (const friendly of allies) {
                if (friendly.getActiveBodyparts(WORK) > 0 && friendly.pos.isNearTo(flag.x, flag.y)) {
                    delete Memory.flags[creep.memory.flag];
                    creep.memory.mode = 1;
                    return true;
                }
            }
        }
        return false;
    }
};
var depositMiner = rDM;

const m$1 = {
    attack: function () {
        if (m$1.attackUnderway()) {
            return;
        }
        const roomName = m$1.getNextRoomToAttack();
        if (roomName) {
            m$1.deployQuad(roomName);
        }
    },
    attackUnderway: function () {
        return _(Object.keys(Memory.flags))
            .find(name => name.includes("quad"));
    },
    getNextRoomToAttack: function () {
        const militaryCache = utils.getsetd(Cache, "military", {});
        const nextTargets = utils.getsetd(militaryCache, "targets", m$1.findTargets());
        return nextTargets && nextTargets.shift();
    },
    findTargets: function () {
        const roomData = utils.getsetd(Cache, "roomData", {});
        const cities = _(utils.getMyCities()).map("name").value();
        const allNeighbors = _(cities).map(city => utils.getAllRoomsInRange(1, [city])).value();
        return _(cities)
            .zipObject(allNeighbors)
            .map((neighbors, city) => {
            return _(neighbors).filter(neighbor => {
                const data = roomData[neighbor] || {};
                const tooFar = () => {
                    const route = Game.map.findRoute(city, neighbor);
                    return route == ERR_NO_PATH || route.length > 1;
                };
                return !Memory.settings.allies.includes(data.own) && data.rcl <= 6
                    && data.sME && data.sME < Game.time && !tooFar();
            }).value();
        })
            .flatten()
            .value();
    },
    deployQuad: function (roomName, boosted = false) {
        const flagPos = m$1.nonWallRoomPos(roomName);
        const closestRoomName = m$1.chooseClosestRoom(flagPos);
        const flagName = `${closestRoomName}0quadRally`;
        if (flagName in Memory.flags) {
            Log.error(`Quad already deployed from ${closestRoomName}`);
            return;
        }
        Memory.flags[flagName] = flagPos;
        m$1.spawnQuad(`${closestRoomName}0`, boosted, roomName);
    },
    nonWallRoomPos: function (roomName) {
        const terrain = Game.map.getRoomTerrain(roomName);
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                if (terrain.get(x, y) != TERRAIN_MASK_WALL) {
                    return new RoomPosition(x, y, roomName);
                }
            }
        }
    },
    chooseClosestRoom: function (flagPos) {
        const cities = utils.getMyCities();
        const goodCities = _.filter(cities, m$1.canSpawnQuad);
        const lengths = _.map(goodCities, city => {
            const testRoomPos = city.getPositionAt(25, 25);
            const testPath = utils.findMultiRoomPath(testRoomPos, flagPos);
            if (testPath.incomplete || city.name == flagPos.roomName) {
                return Number.MAX_VALUE;
            }
            return testPath.cost;
        });
        const i = _.indexOf(lengths, _.min(lengths));
        const nearestCity = goodCities[i];
        if (lengths[i] > CREEP_LIFE_TIME) {
            Log.info(`No valid rooms in range for ${creepNames.cN.QUAD_NAME} in ${flagPos.roomName}`);
        }
        return nearestCity.name;
    },
    canSpawnQuad: function (city) {
        return city.controller.level == 8 &&
            Game.spawns[city.memory.city] &&
            city.storage;
    },
    spawnQuad: function (city, boosted = false, flagName) {
        spawnQueue.initialize(Game.spawns[city]);
        for (let i = 0; i < 4; i++) {
            spawnQueue.schedule(Game.spawns[city], creepNames.cN.QUAD_NAME, boosted, flagName);
        }
    }
};
var military = m$1;

const rH = {
    name: creepNames.cN.HARASSER_NAME,
    type: 11 /* harasser */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
        RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, RESOURCE_CATALYZED_KEANIUM_ALKALIDE],
    run: function (creep) {
        if (creepUtils.maybeBoost(creep)) // get boosted if needed
            return;
        const flagName = creep.memory.flag || creep.memory.city + "harass";
        rH.maybeRespawn(creep, flagName);
        if (rH.dormant(creep))
            return;
        rH.init(creep);
        const hostiles = utils.findHostileCreeps(creep.room);
        rH.maybeHeal(creep, hostiles);
        if (hostiles.length) {
            creep.memory.dormant = false;
            if (creep.memory.target && Game.getObjectById(creep.memory.target) && Game.getObjectById(creep.memory.target) instanceof Structure)
                creep.memory.target = null;
            const needRetreat = rH.maybeRetreat(creep, hostiles);
            if (!needRetreat && (hostiles.length || Game.getObjectById(creep.memory.target)))
                rH.aMove(creep, hostiles);
            rH.shoot(creep, hostiles);
        }
        else {
            if (rH.rally(creep, flagName))
                return;
            const injuredFriendlies = _.filter(utils.findFriendlyCreeps(creep.room), c => c.hits < c.hitsMax);
            if (injuredFriendlies.length)
                return rH.healFriend(creep, injuredFriendlies[0]);
            const hostileStructures = utils.findHostileStructures(creep.room);
            if (hostileStructures.length)
                return rH.attackStruct(creep, hostileStructures[0]);
            // go dormant
            rH.goDormant(creep);
        }
    },
    goDormant: function (creep) {
        const roomCenter = new RoomPosition(25, 25, creep.room.name);
        if (creep.pos.inRangeTo(roomCenter, 10))
            creep.memory.dormant = true;
        motion.newMove(creep, roomCenter, 9);
    },
    healFriend: function (creep, friend) {
        creep.pos.isNearTo(friend.pos) ? creep.heal(friend) : creep.rangedHeal(friend);
        motion.newMove(creep, friend.pos, 0);
    },
    attackStruct: function (creep, struct) {
        creep.rangedAttack(struct);
        motion.newMove(creep, struct.pos, 3);
    },
    // Respawn if damaged or dying of old age. Don't respawn if flag is missing.
    maybeRespawn: function (creep, flagName) {
        if (!Memory.flags[flagName])
            return;
        // respawn if damaged
        if (creep.hits < creep.hitsMax * 0.2 && !creep.memory.reinforced) {
            creep.memory.reinforced = true;
            spawnQueue.respawn(creep, true);
            // add a quad if claiming
            if (Memory.flags["claim"] && creep.room.name == Memory.flags["claim"].roomName)
                military.spawnQuad(creep.memory.city, true, creep.room.name);
        }
        // update TTL to respawn if needed
        if (!creep.memory.respawnTime) {
            const route = motion.getRoute(Memory.flags[flagName].roomName, Game.spawns[creep.memory.city].room.name, true);
            if (route != -2 && route.length)
                creep.memory.respawnTime = (route.length * 50) + (creep.body.length * CREEP_SPAWN_TIME);
            else // if path planning fails, don't set a respawn time
                creep.memory.respawnTime = -1;
        }
        // check if flag can be removed early
        if (Game.time % 51 == 0)
            rH.removeFlag(creep, flagName);
        if (creep.ticksToLive == creep.memory.respawnTime) {
            if (!_.find(creep.room.find(FIND_MY_CREEPS), c => c.memory.role == rH.name && c.name != creep.name))
                spawnQueue.respawn(creep);
        }
    },
    shoot: function (creep, hostiles) {
        //RMA if anybody is touching
        for (let i = 0; i < hostiles.length; i++) {
            if (hostiles[i].pos.isNearTo(creep.pos)) {
                creep.rangedMassAttack();
                creepUtils.logDamage(creep, creep.pos, true);
                return;
            }
        }
        //if target and in range, shoot target, otherwise shoot anybody in range
        if (creep.memory.target) {
            const target = Game.getObjectById(creep.memory.target);
            if (target && target.pos.inRangeTo(creep.pos, 3)) {
                creep.rangedAttack(target);
                creepUtils.logDamage(creep, target.pos);
                return;
            }
        }
        const newTarget = creep.pos.findClosestByRange(hostiles);
        if (newTarget && newTarget.pos.getRangeTo(creep) <= 3) {
            creep.rangedAttack(newTarget);
            creepUtils.logDamage(creep, newTarget.pos);
        }
    },
    dormant: function (creep) {
        if (creep.memory.dormant) {
            if (Game.time % 5 != 0) {
                return true;
            }
        }
        return false;
    },
    maybeRetreat: function (creep, hostiles) {
        const attacker = _.find(hostiles, h => h instanceof Creep
            && h.getActiveBodyparts(ATTACK) > 0
            && (h.fatigue === 0 || h.pos.isNearTo(creep.pos))
            && h.pos.inRangeTo(creep.pos, 2));
        if (attacker || creep.hits < creep.hitsMax) {
            //retreat
            if (creep.saying === "hold") {
                //get less angry
                creep.memory.anger = creep.memory.anger / 2;
            }
            motion.retreat(creep, hostiles);
            return true;
        }
        return false;
    },
    aMove: function (creep, hostiles) {
        const attacker = _.find(hostiles, h => h instanceof Creep
            && h.getActiveBodyparts(ATTACK) > 0
            && (h.fatigue === 0 || h.pos.isNearTo(creep.pos))
            && h.pos.inRangeTo(creep.pos, 3));
        if (attacker) {
            if (creep.saying === "attack") {
                //get more angry
                creep.memory.anger++;
            }
            const rand = Math.floor(Math.random() * 101);
            if (creep.memory.anger > rand) {
                //give chase
                creep.say("attack");
                motion.newMove(creep, attacker.pos, 2);
            }
            else {
                //hold position
                creep.say("hold");
            }
        }
        else {
            if (creep.memory.target) {
                const target = Game.getObjectById(creep.memory.target);
                if (target) {
                    motion.newMove(creep, target.pos, 2);
                    return;
                }
            }
            const target = creep.pos.findClosestByRange(hostiles);
            motion.newMove(creep, target.pos, 2);
            creep.memory.target = target.id;
        }
        //move toward an enemy
    },
    // remove harass flag if it's the only flag in a highway room
    removeFlag: function (creep, flagName) {
        if (!Memory.flags[flagName] || !utils.isHighway(Memory.flags[flagName].roomName)) {
            return;
        }
        for (const flag in Memory.flags) {
            if (flag != flagName && Memory.flags[flag].roomName == Memory.flags[flagName].roomName) {
                return;
            }
        }
        delete Memory.flags[flagName];
    },
    // initialize target and anger
    init: function (creep) {
        if (!creep.memory.target) {
            creep.memory.target = null;
        }
        if (!creep.memory.anger) { //the more angry the creep gets, the more aggressive it'll get
            creep.memory.anger = 0; //anger increases when hostiles run away, and decreases when hostiles give chase
        }
    },
    // heal if needed
    maybeHeal: function (creep, hostiles) {
        const damager = _.find(hostiles, c => c instanceof Creep
            && (c.getActiveBodyparts(ATTACK) > 0
                || c.getActiveBodyparts(RANGED_ATTACK) > 0));
        if (creep.hits < creep.hitsMax || damager) {
            creep.heal(creep);
        }
    },
    // rally if outside of target room
    rally: function (creep, flagName) {
        let dFlag = Memory.flags[flagName];
        if (!dFlag && Game.map.getRoomStatus(flagName))
            dFlag = new RoomPosition(25, 25, flagName);
        if (dFlag && creep.pos.roomName != dFlag.roomName) {
            motion.newMove(creep, new RoomPosition(dFlag.x, dFlag.y, dFlag.roomName), 20);
            return true;
        }
        return false;
    }
};
var harasser = rH;

const rSB = {
    name: creepNames.cN.SPAWN_BUILDER_NAME,
    type: 13 /* spawnBuilder */,
    target: 0,
    boosts: [RESOURCE_CATALYZED_LEMERGIUM_ACID],
    CreepState: {
        BUILD: 1,
        HARVEST: 2,
        RENEW: 3
    },
    /** @param {Creep} creep **/
    run: function (creep) {
        if (Game.cpu.bucket < settings_1.bucket.colony) {
            return;
        }
        const city = creep.memory.city;
        if (creep.memory.needBoost && !creep.memory.boosted) {
            upgrader.getBoosted(creep, rSB.boosts[0]);
            return;
        }
        if (creep.hits < creep.hitsMax) {
            motion.newMove(creep, Game.spawns[city].pos, 10);
            return;
        }
        if (Memory.flags.claimRally && !creep.memory.hasRally) {
            const flag = Memory.flags.claimRally;
            motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName));
            if (flag.x == creep.pos.x && flag.y == creep.pos.y && flag.roomName == creep.pos.roomName) {
                creep.memory.hasRally = true;
            }
            return;
        }
        if (!Memory.flags.claim) {
            Game.spawns[creep.memory.city].memory[rSB.name] = 0;
            if (creep.memory.flagRoom) {
                if (creep.pos.roomName != creep.memory.flagRoom) {
                    motion.newMove(creep, new RoomPosition(24, 24, creep.memory.flagRoom), 23);
                    return;
                }
                creep.memory.city = creep.memory.flagRoom + "0";
                const room = Game.rooms[creep.memory.flagRoom];
                const minerCount = _.filter(room.find(FIND_MY_CREEPS), c => c.memory.role == "remoteMiner").length;
                if (minerCount < 1) {
                    creep.memory.role = "remoteMiner";
                    creep.memory.source = Object.keys(Game.spawns[creep.memory.city].memory.sources)[0];
                    creep.memory.flag = Object.keys(Game.spawns[creep.memory.city].memory.sources)[0];
                    return;
                }
                creep.memory.role = upgrader.name;
            }
            return;
        }
        if (!creep.memory.flagRoom) {
            creep.memory.flagRoom = Memory.flags.claim.roomName;
        }
        if (Game.time % 100 == 0) {
            if (!Memory.flags.claim.startTime) {
                Memory.flags.claim.startTime = Game.time;
            }
            if (Memory.flags.claim.startTime < Game.time - 10000) {
                if (Cache.roomData && Cache.roomData[Memory.flags.claim.roomName]) {
                    Cache.roomData[Memory.flags.claim.roomName].cB = Game.time + 150000;
                }
                utils.removeFlags(Memory.flags.claim.roomName);
                return;
            }
        }
        if (creep.pos.roomName === Memory.flags.claim.roomName) {
            const spawn = Game.spawns[Memory.flags.claim.roomName + "0"];
            if (creep.ticksToLive == 500 && !spawn) {
                spawnQueue.respawn(creep);
            }
            if (!creep.room.controller || !creep.room.controller.my) {
                breaker.breakStuff(creep, null);
                return;
            }
            if (Game.time % 100 == 0 && rSB.jobDone(creep)) {
                delete (Memory.flags.claim);
            }
            if (creep.store.energy == 0) {
                creep.memory.state = rSB.CreepState.HARVEST;
            }
            if (creep.store.energy == creep.store.getCapacity()) {
                if (spawn && creep.ticksToLive < 700) {
                    creep.memory.state = rSB.CreepState.RENEW;
                }
                else {
                    creep.memory.state = rSB.CreepState.BUILD;
                }
            }
            if (creep.memory.state == rSB.CreepState.BUILD) {
                rSB.build(creep);
            }
            else if (creep.memory.state == rSB.CreepState.RENEW) {
                rSB.renew(creep, spawn);
            }
            else {
                rSB.harvest(creep);
            }
        }
        else {
            const flag = Memory.flags.claim;
            motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName), 5);
        }
    },
    jobDone: function (creep) {
        const extensions = _.filter(creep.room.find(FIND_MY_STRUCTURES), structure => structure.structureType == STRUCTURE_EXTENSION);
        const cSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        return (extensions.length > 4 && !cSites.length);
    },
    build: function (creep) {
        if (creep.room.controller && creep.room.controller.level < 2
            || creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] - 5000
            || (creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] - 1000 && creep.pos.inRangeTo(creep.room.controller.pos, 3))) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                motion.newMove(creep, creep.room.controller.pos, 3);
            }
            return;
        }
        const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        const spawn = _.find(targets, site => site.structureType == STRUCTURE_SPAWN);
        const extensions = _.find(targets, site => site.structureType == STRUCTURE_EXTENSION);
        const storage = _.find(targets, site => site.structureType == STRUCTURE_STORAGE);
        const terminal = _.find(targets, site => site.structureType == STRUCTURE_TERMINAL);
        const tower = _.find(targets, site => site.structureType == STRUCTURE_TOWER);
        if (targets.length) {
            let target = targets[0];
            if (terminal) {
                target = terminal;
            }
            else if (spawn) {
                target = spawn;
            }
            else if (extensions) {
                target = extensions;
            }
            else if (storage) {
                target = storage;
            }
            else if (tower) {
                target = tower;
            }
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                motion.newMove(creep, target.pos, 3);
            }
        }
        else {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                motion.newMove(creep, creep.room.controller.pos, 3);
            }
        }
    },
    harvest: function (creep) {
        const terminal = creep.room.terminal;
        if (terminal && terminal.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
            actions_1.withdraw(creep, terminal, RESOURCE_ENERGY);
            return;
        }
        const dropped = _.find(creep.room.find(FIND_DROPPED_RESOURCES), r => r.resourceType == RESOURCE_ENERGY && r.amount > 50);
        if (dropped) {
            actions_1.pick(creep, dropped);
            return;
        }
        const sources = creep.room.find(FIND_SOURCES);
        if (sources.length == 1) {
            const result = creep.harvest(sources[0]);
            if (result == ERR_NOT_IN_RANGE) {
                motion.newMove(creep, sources[0].pos, 1);
            }
            return;
        }
        const result = creep.harvest(sources[creep.memory.mode]);
        if (result == ERR_NOT_IN_RANGE) {
            if (creep.moveTo(sources[creep.memory.mode], { reusePath: 15, range: 1, maxRooms: 1 }) == ERR_NO_PATH) {
                creep.memory.mode = (creep.memory.mode + 1) % 2;
            }
        }
        else if (result == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.mode = (creep.memory.mode + 1) % 2;
        }
    },
    renew: function (creep, spawn) {
        if (!creep.pos.isNearTo(spawn.pos))
            motion.newMove(creep, spawn.pos, 1);
        if (creep.ticksToLive > 1450 || creep.store.energy == 0)
            creep.memory.state = rSB.CreepState.HARVEST;
        if (spawn.store.energy < 100)
            creep.transfer(spawn, RESOURCE_ENERGY, Math.min(100, creep.store.energy));
        spawn.renewCreep(creep);
    }
};
var spawnBuilder = rSB;

const rC = {
    name: creepNames.cN.CLAIMER_NAME,
    type: 21 /* claimer */,
    /** @param {Creep} creep **/
    run: function (creep) {
        return rC.claimRally(creep, Memory.flags.claimRally) ||
            rC.runClaimer(creep, Memory.flags.claim, rC.claim);
    },
    claimRally: function (creep, flag) {
        if (!flag || creep.memory.rally) {
            return false;
        }
        motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName));
        if (flag.x == creep.pos.x && flag.y == creep.pos.y) {
            creep.memory.rally = true;
        }
        return true;
    },
    runClaimer: function (creep, flag, actionFn) {
        if (!flag) {
            return false;
        }
        if (flag.roomName != creep.pos.roomName) {
            motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName), 5);
        }
        else if (!creep.pos.isNearTo(creep.room.controller.pos)) {
            motion.newMove(creep, creep.room.controller.pos, 1);
        }
        else {
            actionFn(creep);
        }
        return true;
    },
    claim: function (creep) {
        const newCity = creep.room.name + "0";
        creep.signController(creep.room.controller, "Piky");
        creep.room.memory.city = newCity;
        if (creep.claimController(creep.room.controller) == ERR_INVALID_TARGET && !creep.room.controller.my) {
            creep.attackController(creep.room.controller);
        }
    }
};
var claimer = rC;

const rUC = {
    name: creepNames.cN.UNCLAIMER_NAME,
    type: 10 /* unclaimer */,
    /** @param {Creep} creep **/
    run: function (creep) {
        return claimer.claimRally(creep, Memory.flags.unclaimRally) ||
            claimer.runClaimer(creep, Memory.flags.unclaim, rUC.unclaim);
    },
    unclaim: function (creep) {
        const result = creep.attackController(creep.room.controller);
        if (!creep.room.controller.level && !creep.room.controller.reservation) {
            delete Memory.flags.unclaim;
        }
        if (result === OK && !creep.room.controller.reservation) {
            Game.spawns[creep.memory.city].memory[rUC.name] = 0;
            creep.suicide();
        }
    }
};
var unclaimer = rUC;

class FerryTask {
    constructor(sourceId, targetId, resourceType, quantity) {
        this.resourceType = resourceType;
        this.quantity = quantity;
        this.inProgress = false;
        this.sourceId = sourceId;
        this.targetId = targetId;
    }
}
const rF = {
    name: creepNames.cN.FERRY_NAME,
    type: 14 /* ferry */,
    target: 0,
    TERMINAL_MAX_MINERAL_AMOUNT: 9000,
    FERRY_CARRY_AMOUNT: 1000,
    // find a task based on source and target Ids
    findTask: function (taskQueue, source, target) {
        return _.find(taskQueue, task => task.targetId == target && task.sourceId == source);
    },
    queueUpgradeLink: function (taskQueue, spawn) {
        const storageLink = Game.getObjectById(spawn.memory.storageLink);
        const cachedLinks = Cache[spawn.room.name] && Cache[spawn.room.name].links || {};
        const upgradeLink = Game.getObjectById(cachedLinks.upgrade);
        if (storageLink && !storageLink.store.energy && storageLink.cooldown < 2 && upgradeLink && !upgradeLink.store.energy) {
            const task = new FerryTask(spawn.room.storage.id, storageLink.id, RESOURCE_ENERGY, LINK_CAPACITY);
            taskQueue.push(task);
        }
    },
    // generate queue of ferry tasks for any ferry or transporter to complete (or runner?)
    // this may be relatively expensive, so we should try to run this infrequently
    // 10 - 50 ticks seems reasonable, could be semi dynamic based on cpu
    // we could have other events trigger a TQ reassessment, such as a link firing or boosted creep being scheduled
    generateTaskQueue: function (spawn) {
        const taskQueue = utils.getsetd(Cache[spawn.room.name], "taskQueue", []);
        // check for creeps completing tasks. We can't add more tasks to the queue until all creeps have completed their tasks
        const ferries = _.filter(spawn.room.find(FIND_MY_CREEPS), c => c.memory.role == creepNames.cN.TRANSPORTER_NAME
            || c.memory.role == creepNames.cN.FERRY_NAME);
        if (ferries.length) {
            return;
        }
        rF.queueUpgradeLink(taskQueue, spawn);
    },
    run: function (creep) {
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return;
        }
        if (creep.ticksToLive == creep.body.length * CREEP_SPAWN_TIME) {
            spawnQueue.respawn(creep);
        }
        if (creep.saying == "getJob") {
            creep.memory.mode = rF.getJob(creep);
        }
        const refreshTime = Memory.avgCpu < 0.7 * Game.cpu.limit ? 2 : 10;
        const link = Game.getObjectById(Game.spawns[creep.memory.city].memory.storageLink);
        switch (creep.memory.mode) {
            case 0:
                //no jobs available
                //Log.info('hi')
                if (Game.time % refreshTime === 0) {
                    creep.say("getJob");
                }
                break;
            case 1:
                //move energy from storage to terminal
                if (creep.store.energy > 0) {
                    actions_1.charge(creep, creep.room.terminal);
                }
                else if (creep.room.storage.store.energy > 150000 && creep.room.terminal.store.energy < 50000) {
                    if (Game.time % 10 === 0 || Game.time % 10 === 1) {
                        creep.memory.mode = rF.getJob(creep);
                        break;
                    }
                    actions_1.withdraw(creep, creep.room.storage, RESOURCE_ENERGY);
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            case 2:
                //move minerals from storage to terminal
                if (_.sum(Object.values(creep.store)) > 0) {
                    actions_1.charge(creep, creep.room.terminal);
                    break;
                }
                if (creep.room.storage.store[creep.memory.mineral] > 0
                    && creep.room.terminal.store[creep.memory.mineral] < rF.TERMINAL_MAX_MINERAL_AMOUNT - rF.FERRY_CARRY_AMOUNT
                    && _.sum(Object.values(creep.room.terminal.store)) < 295000) {
                    actions_1.withdraw(creep, creep.room.storage, creep.memory.mineral);
                }
                else {
                    creep.say("getJob");
                }
                break;
            case 3:
                //move energy from terminal to storage
                if (creep.store.energy > 0) {
                    actions_1.charge(creep, creep.room.storage);
                }
                else if (creep.room.terminal.store.energy > 51000) {
                    actions_1.withdraw(creep, creep.room.terminal, RESOURCE_ENERGY);
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            case 4: {
                //move power from terminal to power spawn
                const powerSpawn = _.find(creep.room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_POWER_SPAWN);
                if ((creep.store.power) > 0) {
                    actions_1.charge(creep, powerSpawn);
                    //creep.transfer(powerSpawn, 'power')
                }
                else if (powerSpawn.power < 30 && creep.room.terminal.store.power) {
                    actions_1.withdraw(creep, creep.room.terminal, RESOURCE_POWER, Math.min(70, creep.room.terminal.store[RESOURCE_POWER]));
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            }
            case 5:
                //move energy from storage link to storage
                if (creep.store.energy > 0) {
                    actions_1.charge(creep, creep.room.storage);
                }
                else if (link.energy > 0) {
                    actions_1.withdraw(creep, link, RESOURCE_ENERGY);
                }
                else {
                    creep.say("getJob");
                }
                break;
            case 6:
                //move mineral from terminal to storage
                if (_.sum(Object.values(creep.store)) > 0) {
                    actions_1.charge(creep, creep.room.storage);
                    break;
                }
                if (creep.room.terminal.store[creep.memory.mineral] > rF.TERMINAL_MAX_MINERAL_AMOUNT) {
                    actions_1.withdraw(creep, creep.room.terminal, creep.memory.mineral);
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            case 7: {
                //move mineral from lab to terminal
                break;
            }
            case 8:
                //load up the nuker
                if (_.sum(Object.values(creep.store)) > 0) {
                    const nuker = Game.getObjectById(creep.memory.nuker);
                    const result = actions_1.charge(creep, nuker);
                    if (result == 1) {
                        creep.say("getJob");
                    }
                    break;
                }
                if (creep.room.terminal.store["G"] >= 4000) {
                    actions_1.withdraw(creep, creep.room.terminal, RESOURCE_GHODIUM);
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            case 9: {
                //move mineral from terminal to booster
                const lab = Game.getObjectById(creep.memory.lab);
                if (_.sum(Object.values(creep.store)) > 0) {
                    const result = actions_1.charge(creep, lab);
                    if (result == 1) {
                        if (creep.memory.reactor) {
                            Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.reactors[creep.memory.lab].fill--;
                        }
                        else {
                            Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers[creep.memory.lab].fill--;
                        }
                        creep.say("getJob");
                    }
                    break;
                }
                const amountNeeded = Math.min(lab.store.getFreeCapacity(creep.memory.mineral), creep.store.getFreeCapacity());
                if (amountNeeded === 0 && creep.memory.reactor) {
                    //lab has incorrect mineral
                    //clear both reactors to reset lab process
                    rF.clearReactors(Game.spawns[creep.memory.city].memory);
                    creep.memory.mode = rF.getJob(creep);
                    break;
                }
                if (creep.room.terminal.store[creep.memory.mineral] >= amountNeeded) {
                    actions_1.withdraw(creep, creep.room.terminal, creep.memory.mineral, amountNeeded);
                }
                else {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            }
            case 10: {
                //move mineral from booster to terminal
                if (_.sum(Object.values(creep.store)) > 0) {
                    const result = actions_1.charge(creep, creep.room.terminal);
                    if (result == 1) {
                        creep.say("getJob");
                        break;
                    }
                    break;
                }
                const lab = Game.getObjectById(creep.memory.lab);
                if (lab.mineralType == undefined || actions_1.withdraw(creep, lab, lab.mineralType) == 1 && lab.store[lab.mineralType] <= 1000) {
                    const labInfo = Game.spawns[creep.memory.city].memory.ferryInfo.labInfo;
                    if (creep.memory.reactor && labInfo.reactors[creep.memory.lab].fill == -1) {
                        labInfo.reactors[creep.memory.lab].fill = 0;
                    }
                    else if (labInfo.receivers[creep.memory.lab].fill == -1) {
                        Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers[creep.memory.lab].fill = 0;
                    }
                }
                if (lab.mineralType == undefined) {
                    creep.memory.mode = rF.getJob(creep);
                }
                break;
            }
            case 11: {
                //move produce from factory to terminal
                if (_.sum(Object.values(creep.store)) > 0) {
                    const result = actions_1.charge(creep, creep.room.terminal);
                    if (result == 1) { //successful deposit, remove element from task list
                        _.pullAt(Game.spawns[creep.memory.city].memory.ferryInfo.factoryInfo.transfer, creep.memory.labNum); //remove element
                        creep.say("getJob");
                    }
                    break;
                }
                const factory = Game.getObjectById(creep.memory.lab);
                if (!factory.store[creep.memory.mineral]) {
                    actions_1.withdraw(creep, factory, RESOURCE_ENERGY, 1);
                }
                else {
                    actions_1.withdraw(creep, factory, creep.memory.mineral, Math.min(creep.memory.quantity, creep.store.getCapacity()));
                }
                break;
            }
            case 12:
                //move component from terminal to factory
                if (_.sum(Object.values(creep.store)) > 0) {
                    const factory = Game.getObjectById(creep.memory.lab);
                    const result = creep.transfer(factory, creep.memory.mineral, creep.memory.quantity);
                    if (result == 0) {
                        _.pullAt(Game.spawns[creep.memory.city].memory.ferryInfo.factoryInfo.transfer, creep.memory.labNum); //remove element
                        creep.say("getJob");
                        break;
                    }
                    creep.moveTo(factory);
                    break;
                }
                actions_1.withdraw(creep, creep.room.terminal, creep.memory.mineral, creep.memory.quantity);
                break;
            case 13:
                // move energy from storage to link
                if (creep.store.energy === 0 && link.energy === 0) { //both are empty
                    actions_1.withdraw(creep, creep.room.storage, RESOURCE_ENERGY, LINK_CAPACITY);
                }
                else if (link.energy === 0) { //link is empty and creep has energy
                    actions_1.charge(creep, link);
                }
                else if (creep.store.energy > 0) { //link has energy and creep has energy
                    creep.memory.mode = 5; //switch to depositing energy in storage
                }
                else { //job done: link has energy and creep is empty
                    creep.say("getJob");
                }
                break;
        }
    },
    getJob: function (creep) {
        if (creep.ticksToLive < 50) {
            creep.suicide();
            return 0;
        }
        const link = Game.getObjectById(Game.spawns[creep.memory.city].memory.storageLink);
        let upgradeLink = null;
        if (Cache[creep.room.name]) {
            const links = Cache[creep.room.name].links || {};
            upgradeLink = Game.getObjectById(links.upgrade);
        }
        if (link && !link.store.energy && upgradeLink && !upgradeLink.store.energy) {
            return 13;
        }
        else if (link && link.store.energy > 0 && !link.cooldown) {
            return 5;
        }
        if (!creep.room.terminal) {
            return 0;
        }
        const storage = creep.room.storage;
        if (storage && storage.store.energy > 150000 && creep.room.terminal.store.energy < 50000 && _.sum(Object.values(creep.room.terminal.store)) < 295000) {
            return 1;
        }
        if (creep.room.terminal.store.energy > 51000) {
            return 3;
        }
        if (Game.spawns[creep.memory.city].memory.ferryInfo.needPower && Game.spawns[creep.memory.city].room.terminal.store[RESOURCE_POWER] > 0) {
            return 4;
        }
        if (Game.spawns[creep.memory.city].memory.ferryInfo.labInfo
            && Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.reactors
            && Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers) {
            const reactors = Object.keys(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.reactors);
            const reactorInfo = Object.values(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.reactors);
            for (let i = 0; i < reactors.length; i++) {
                if (!reactorInfo[i].fill) {
                    continue;
                }
                if (reactorInfo[i].fill == -1) {
                    //empty reactor
                    creep.memory.lab = reactors[i];
                    creep.memory.reactor = true;
                    return 10;
                }
                if (reactorInfo[i].fill > 0 && creep.room.terminal.store[reactorInfo[i].mineral] >= 1000) {
                    //fill reactor
                    creep.memory.lab = reactors[i];
                    creep.memory.reactor = true;
                    creep.memory.mineral = reactorInfo[i].mineral;
                    return 9;
                }
            }
            const receivers = Object.keys(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers);
            const receiverInfo = Object.values(Game.spawns[creep.memory.city].memory.ferryInfo.labInfo.receivers);
            for (let i = 0; i < receivers.length; i++) {
                if (!receiverInfo[i].fill) {
                    continue;
                }
                if (receiverInfo[i].fill == -1) {
                    //empty receiver
                    creep.memory.lab = receivers[i];
                    creep.memory.reactor = false;
                    return 10;
                }
                if (receiverInfo[i].fill > 0 && creep.room.terminal.store[receiverInfo[i].boost] >= 1000) {
                    //fill receiver
                    const lab = Game.getObjectById(receivers[i]);
                    creep.memory.lab = receivers[i];
                    creep.memory.reactor = false;
                    if (lab.mineralType && lab.mineralType != receiverInfo[i].boost) {
                        return 10;
                    }
                    creep.memory.mineral = receiverInfo[i].boost;
                    return 9;
                }
                else if (receiverInfo[i].fill > 0 && creep.room.terminal.store[receiverInfo[i].boost] < 1000
                    && !Game.spawns[creep.memory.city].memory.ferryInfo.mineralRequest) {
                    Game.spawns[creep.memory.city].memory.ferryInfo.mineralRequest = receiverInfo[i].boost;
                }
            }
        }
        if (storage && Object.keys(storage.store).length > 1) {
            for (const mineral of Object.keys(storage.store)) {
                if (creep.room.terminal.store[mineral] < rF.TERMINAL_MAX_MINERAL_AMOUNT - rF.FERRY_CARRY_AMOUNT) {
                    creep.memory.mineral = mineral;
                    return 2;
                }
            }
        }
        if (storage) {
            for (const mineral of Object.keys(creep.room.terminal.store)) {
                if (creep.room.terminal.store[mineral] > rF.TERMINAL_MAX_MINERAL_AMOUNT && mineral != RESOURCE_ENERGY) {
                    creep.memory.mineral = mineral;
                    return 6;
                }
            }
        }
        if (Game.spawns[creep.memory.city].memory.ferryInfo.factoryInfo) {
            const transfer = Game.spawns[creep.memory.city].memory.ferryInfo.factoryInfo.transfer;
            if (transfer.length) {
                for (let i = 0; i < transfer.length; i++) {
                    if (transfer[i][1] === 0) { //move produce from factory to terminal
                        creep.memory.mineral = transfer[i][0];
                        creep.memory.quantity = transfer[i][2];
                        creep.memory.labNum = i; //use labNum as index
                        creep.memory.lab = _.find(creep.room.find(FIND_MY_STRUCTURES), structure => structure.structureType == STRUCTURE_FACTORY).id;
                        return 11;
                    }
                    if (transfer[i][1] === 1) { //move component from terminal to factory OR request mineral if no mineral request
                        //if compenent that is needed is not in terminal, do not request, component will be delivered by empire manager
                        if (creep.room.terminal.store[transfer[i][0]] >= transfer[i][2]) {
                            creep.memory.mineral = transfer[i][0];
                            creep.memory.quantity = transfer[i][2];
                            creep.memory.labNum = i;
                            creep.memory.lab = _.find(creep.room.find(FIND_MY_STRUCTURES), structure => structure.structureType == STRUCTURE_FACTORY).id;
                            return 12;
                        }
                        if (_.includes(Object.keys(REACTIONS), String(transfer[i][0]))) { // must be a mineral of some sort
                            if (!Game.spawns[creep.memory.city].memory.ferryInfo.mineralRequest) {
                                Game.spawns[creep.memory.city].memory.ferryInfo.mineralRequest = transfer[i][0];
                            }
                        }
                    }
                }
            }
        }
        const nuker = _.find(creep.room.find(FIND_MY_STRUCTURES), structure => structure.structureType == STRUCTURE_NUKER);
        if (nuker && nuker.store[RESOURCE_GHODIUM] < nuker.store.getCapacity(RESOURCE_GHODIUM) && creep.room.terminal.store["G"] >= 4000) {
            creep.memory.nuker = nuker.id;
            return 8;
        }
        return 0;
    },
    clearReactors: function (memory) {
        const reactorInfo = Object.values(memory.ferryInfo.labInfo.reactors);
        for (const reactor of reactorInfo) {
            reactor.fill = -1;
        }
    }
};
var ferry = rF;

const CreepState$2 = {
    START: 1,
    BOOST: 2,
    ENGAGE: 3,
    DORMANT: 4,
};
const CS$2 = CreepState$2;
const rD = {
    name: creepNames.cN.DEFENDER_NAME,
    type: 9 /* defender */,
    boosts: [RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
        RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
        RESOURCE_CATALYZED_KEANIUM_ALKALIDE],
    /** @param {Creep} creep **/
    run: function (creep) {
        const city = creep.memory.city;
        const holdPoint = 30;
        if (!creep.memory.state) {
            creep.memory.state = CS$2.START;
        }
        let hostiles = [];
        if (creep.memory.state != CS$2.DORMANT) {
            hostiles = utils.findHostileCreeps(creep.room);
        }
        switch (creep.memory.state) {
            case CS$2.START:
                rD.init(creep);
                break;
            case CS$2.BOOST:
                rD.boost(creep);
                break;
            case CS$2.ENGAGE:
                if (!harasser.maybeRetreat(creep, hostiles)) {
                    if (hostiles.length && creep.pos.inRangeTo(Game.spawns[city], holdPoint)) {
                        harasser.aMove(creep, hostiles);
                    }
                    else if (creep.ticksToLive < CREEP_LIFE_TIME) {
                        motion.newMove(creep, Game.spawns[city].pos, holdPoint);
                    }
                }
                break;
            case CS$2.DORMANT:
                rD.dormant(creep);
                return;
        }
        harasser.shoot(creep, hostiles);
        harasser.maybeHeal(creep, hostiles);
        if (!hostiles.length && creep.hits == creep.hitsMax) {
            creep.say("sleep");
            if (creep.saying == "sleep") {
                motion.newMove(creep, Game.spawns[creep.memory.city].room.controller.pos, 2);
            }
            if (creep.pos.inRangeTo(Game.spawns[creep.memory.city].room.controller, 2)) {
                creep.memory.state = CS$2.DORMANT;
            }
        }
    },
    init: function (creep) {
        if (!creep.memory.target) {
            creep.memory.target = null;
        }
        if (!creep.memory.anger) { //the more angry the creep gets, the more aggressive it'll get
            creep.memory.anger = 0; //anger increases when hostiles run away, and decreases when hostiles give chase (see rH.aMove)
        }
        if (creep.memory.needBoost) {
            creep.memory.state = CS$2.BOOST;
        }
        else {
            creep.memory.state = CS$2.ENGAGE;
        }
    },
    boost: function (creep) {
        if (creep.memory.boosted) {
            creep.memory.state = CS$2.ENGAGE;
            return;
        }
        actions_1.getBoosted(creep);
        return;
        //get boosted, may get boosted using same method as offensive creeps
    },
    engage: function (creep) {
        return creep;
        //TODO
        //attack designated weak target, or nearest target if no designation
    },
    dormant: function (creep) {
        if (Game.spawns[creep.memory.city].memory.towersActive) {
            creep.memory.state = CS$2.ENGAGE;
        }
        return creep;
        //if in a safe space, hibernate until towers active
    },
    iOwn: function (roomName) {
        const room = Game.rooms[roomName];
        return (room && room.controller && room.controller.my);
    }
};
var defender = rD;

const rB = {
    name: creepNames.cN.BUILDER_NAME,
    type: 8 /* builder */,
    boosts: [RESOURCE_CATALYZED_LEMERGIUM_ACID],
    /** @param {Creep} creep **/
    run: function (creep) {
        //get boosted if needed
        if (creep.memory.needBoost && !creep.memory.boosted) {
            const boost = "XLH2O";
            upgrader.getBoosted(creep, boost);
            return;
        }
        const rcl = Game.spawns[creep.memory.city].room.controller.level;
        rB.decideWhetherToBuild(creep);
        if (creep.memory.building) {
            if (!rB.build(creep)) {
                if (rcl >= 4) {
                    rB.repWalls(creep);
                }
                else {
                    rB.repair(creep);
                }
            }
        }
        else {
            creepUtils.getEnergy(creep);
        }
    },
    repair: function (creep) {
        const needRepair = _.find(creep.room.find(FIND_STRUCTURES), structure => (structure.hits < (0.4 * structure.hitsMax)) && (structure.structureType != STRUCTURE_WALL) && (structure.structureType != STRUCTURE_RAMPART));
        if (needRepair) {
            creep.memory.repair = needRepair.id;
            return actions_1.repair(creep, needRepair);
        }
        else if (Game.time % 100 == 0
            && !Game.spawns[creep.memory.city].room.find(FIND_MY_CONSTRUCTION_SITES).length) {
            creep.memory.role = creepNames.cN.UPGRADER_NAME;
        }
    },
    build: function (creep) {
        if (creep.memory.build) { //check for site and build
            const site = Game.getObjectById(creep.memory.build);
            if (site) { //if there is a build site, build it, else set build to null
                //build site
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    motion.newMove(creep, site.pos, 3);
                }
                return true;
            }
            else {
                creep.memory.build = null;
            }
        }
        if (!creep.memory.nextCheckTime || creep.memory.nextCheckTime < Game.time) { //occasionally scan for construction sites
            //if room is under siege (determined by presence of a defender OR active towers),
            // ignore any construction sites outside of wall limits
            let targets = Game.spawns[creep.memory.city].room.find(FIND_MY_CONSTRUCTION_SITES);
            const siege = (_.find(creep.room.find(FIND_MY_CREEPS), c => c.memory.role == defender.name) || Game.spawns[creep.memory.city].memory.towersActive)
                && !Game.spawns[creep.memory.city].room.controller.safeMode;
            if (siege) {
                const plan = creep.room.memory.plan;
                targets = _.reject(targets, site => (site.pos.x > plan.x + template.dimensions.x
                    || site.pos.y > plan.y + template.dimensions.y
                    || site.pos.x < plan.x
                    || site.pos.y < plan.y)
                    && !(site.structureType == STRUCTURE_RAMPART || site.structureType == STRUCTURE_WALL));
            }
            if (targets.length) {
                const targetsByCost = _.sortBy(targets, target => target.progressTotal);
                creep.memory.build = targetsByCost[0].id;
                return true;
            }
            creep.memory.nextCheckTime = Game.time + 100;
        }
        return false;
    },
    repWalls: function (creep) {
        const lookTime = 5;
        if (creep.memory.repair) { //check for target and repair
            const target = Game.getObjectById(creep.memory.repair);
            if (target) { //if there is a target, repair it
                if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                    const box = creep.pos.roomName == Game.spawns[creep.memory.city].pos.roomName
                        && Game.spawns[creep.memory.city].memory.towersActive
                        && motion.getBoundingBox(creep.room);
                    if (box) {
                        box.top--;
                        box.bottom++;
                        box.left--;
                        box.right++;
                    }
                    motion.newMove(creep, target.pos, 3, true, box);
                }
            }
            else {
                creep.memory.repair = null;
            }
        }
        if ((creep.store.getFreeCapacity() == 0 && Game.time % lookTime == 0) || !creep.memory.repair) { //occasionally scan for next target to repair
            const buildings = Game.spawns[creep.memory.city].room.find(FIND_STRUCTURES);
            const nukeRampart = rB.getNukeRampart(buildings, Game.spawns[creep.memory.city].room);
            if (nukeRampart) {
                creep.memory.repair = nukeRampart.id;
                return;
            }
            const walls = _.filter(buildings, struct => [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(struct.structureType) && !roomUtils.isNukeRampart(struct.pos));
            if (walls.length) { //find lowest hits wall
                const minWall = _.min(walls, wall => wall.hits);
                creep.memory.repair = minWall.id;
                return;
            }
        }
        return;
    },
    getNukeRampart: function (structures, room) {
        const nukes = room.find(FIND_NUKES);
        if (!nukes.length) {
            return null;
        }
        const ramparts = _.filter(structures, s => s.structureType == STRUCTURE_RAMPART && roomUtils.isNukeRampart(s.pos));
        for (const rampart of ramparts) {
            let hitsNeeded = 0;
            for (const nuke of nukes) {
                if (rampart.pos.isEqualTo(nuke.pos)) {
                    hitsNeeded += 5000000;
                }
                if (rampart.pos.inRangeTo(nuke.pos, 2)) {
                    hitsNeeded += 5000000;
                }
            }
            if (hitsNeeded > 0 && hitsNeeded + 50000 > rampart.hits) {
                return rampart;
            }
        }
        return null;
    },
    decideWhetherToBuild: function (creep) {
        if (creep.store.energy == 0 && creep.memory.building) {
            creep.memory.building = false;
        }
        if (creep.store.energy == creep.store.getCapacity() && !creep.memory.building) {
            creep.memory.building = true;
        }
    }
};
var builder = rB;

function getRecipe(type, energyAvailable, room, boosted = false, flagName) {
    const energy = energyAvailable || 0;
    const rcl = room.controller.level;
    switch (type) {
        case 0 /* brick */:
            return scalingBody([1, 1], [ATTACK, MOVE], energy, 20);
        case 1 /* reserver */:
            return reserverBody(energyAvailable);
        case 2 /* scout */:
            return [MOVE];
        case 3 /* quad */:
            return quadBody(energy, rcl, room, boosted);
        case 4 /* runner */:
            return runnerBody(energy, rcl);
        case 5 /* miner */:
            return minerBody(energy, rcl, room, flagName);
        case 6 /* normal */:
            return upgraderBody(energy, rcl, room);
        case 7 /* transporter */:
            return scalingBody([2, 1], [CARRY, MOVE], energy, 30);
        case 8 /* builder */:
            return builderBody(energy, rcl);
        case 9 /* defender */:
            return defenderBody(energy, rcl, boosted);
        case 21 /* claimer */:
            return body([5, 1], [MOVE, CLAIM]);
        case 10 /* unclaimer */:
            return scalingBody([2, 1], [MOVE, CLAIM], energy);
        case 11 /* harasser */:
            return harasserBody(energy, boosted, rcl);
        case 12 /* repairer */:
            return repairerBody(energy);
        case 22 /* robber */:
            return scalingBody([1, 1], [CARRY, MOVE], energy);
        case 13 /* spawnBuilder */:
            return scalingBody([2, 3, 5], [WORK, CARRY, MOVE], energy);
        case 14 /* ferry */:
            return scalingBody([2, 1], [CARRY, MOVE], energy, 30);
        case 15 /* breaker */:
            return breakerBody(energy, rcl, boosted);
        case 16 /* medic */:
            return medicBody(energy, rcl, boosted);
        case 25 /* sKguard */:
            return body([1, 23, 16, 1, 5, 1, 2, 1], [ATTACK, MOVE, ATTACK, RANGED_ATTACK, HEAL, RANGED_ATTACK, MOVE, HEAL]);
        case 17 /* powerMiner */:
            return pMinerBody(boosted);
        case 23 /* mineralMiner */:
            return mineralMinerBody(rcl);
        case 24 /* depositMiner */:
            return body(dMinerCalc(room, boosted, flagName), [WORK, CARRY, MOVE]);
    }
    Log.error(`No recipe found for ${type} in ${room.name} with ${energy} energy`);
    return [MOVE];
}
function body(counts, order) {
    // assert counts.length == order.length
    const nestedPartsLists = _.map(counts, (count, index) => Array(count).fill(order[index]));
    return _.flatten(nestedPartsLists);
}
//cost and store functions
function cost(recipe) {
    const costList = _.map(recipe, part => BODYPART_COST[part]);
    return _.sum(costList);
}
function store(recipe) {
    return _.filter(recipe, part => part == CARRY).length * CARRY_CAPACITY;
}
function dMinerCalc(room, boosted, flagName) {
    const city = room.memory.city;
    const spawn = Game.spawns[city];
    const baseBody = [1, 1, 1];
    const flag = Memory.flags[flagName];
    if (!flag) {
        return baseBody;
    }
    let harvested = flag.harvested;
    if (!harvested) {
        harvested = 0;
    }
    //distance calculated using method of travel for consistency
    const route = motion.getRoute(spawn.pos.roomName, flag.roomName, true);
    if (route == -2)
        throw Error(`Invalid route from ${spawn.pos.roomName} to ${flag.roomName} for depositMiner`);
    const distance = route.length * 50;
    const workTime = CREEP_LIFE_TIME - (distance * 3); //distance x 3 since it'll take 2x as long on return
    const result = depositMinerBody(workTime, harvested, boosted, baseBody);
    if (_.isEqual(result, baseBody)) {
        delete Memory.flags[flagName];
    }
    return result;
}
function mineralMinerBody(rcl) {
    return rcl > 6 ? body([20, 10, 15], [WORK, CARRY, MOVE]) : body([12, 6, 9], [WORK, CARRY, MOVE]);
}
function runnerBody(energy, rcl) {
    return rcl == 1 ? scalingBody([1, 1], [CARRY, MOVE], energy) : scalingBody([2, 1], [CARRY, MOVE], energy);
}
function depositMinerBody(workTime, harvested, boosted, baseBody) {
    let works = 20;
    let carries = getCarriesFromWorks(works, workTime, harvested, boosted);
    if (carries < 8) { // if we're getting less than 400 resource in a lifetime, drop the source
        return baseBody;
    }
    if (carries > 10) {
        //body is impossible so we have to decrease works
        for (let i = 0; i < 2; i++) {
            works = works / 2;
            carries = getCarriesFromWorks(works, workTime, harvested, boosted);
            const moves = Math.max(Math.ceil((works + carries) / 2), works);
            if (works + carries + moves <= MAX_CREEP_SIZE) {
                return [works, carries, moves];
            }
        }
        //can't go under 5 works => make max body
        const moves = Math.floor(MAX_CREEP_SIZE / 3);
        carries = 2 * moves - works;
        return [works, carries, moves];
    }
    else {
        const moves = works;
        return [works, carries, moves];
    }
}
function getCarriesFromWorks(works, workTime, alreadyHarvested, boosted) {
    const workPower = getWorkPower(works, boosted);
    const carryAmount = getHarvestResults(workPower, workTime, alreadyHarvested) - alreadyHarvested;
    return getCarriesNeeded(carryAmount, boosted);
}
function getWorkPower(work, boosted) {
    if (boosted)
        return work * BOOSTS[WORK][RESOURCE_CATALYZED_UTRIUM_ALKALIDE].harvest;
    else
        return work;
}
function getCarriesNeeded(resourceAmount, boosted) {
    const boostMultiple = BOOSTS[CARRY][RESOURCE_CATALYZED_KEANIUM_ACID].capacity;
    const resourcesPerCarry = boosted ? CARRY_CAPACITY * boostMultiple : CARRY_CAPACITY;
    return Math.floor(resourceAmount / resourcesPerCarry);
}
function calcCooldown(harvested) {
    return Math.ceil(DEPOSIT_EXHAUST_MULTIPLY * Math.pow(harvested, DEPOSIT_EXHAUST_POW));
}
function getHarvestResults(works, ticks, harvested) {
    if (ticks <= 0) {
        return harvested;
    }
    else {
        return getHarvestResults(works, ticks - calcCooldown(harvested + works) - 1, harvested + works);
    }
}
function pMinerBody(boosted) {
    if (boosted) {
        return body([3, 16, 19], [TOUGH, ATTACK, MOVE]);
    }
    return body([20, 20], [MOVE, ATTACK]);
}
function minerBody(energyAvailable, rcl, room, flag) {
    if (Game.time > 15000)
        energyAvailable = Math.max(energyAvailable, 300);
    let works = Math.floor((energyAvailable) / BODYPART_COST[WORK]);
    let pc = null;
    const source = Game.getObjectById(flag);
    if (rcl == 8) {
        if (source && source.room.name == room.name) {
            pc = room.find(FIND_MY_POWER_CREEPS, { filter: c => c.powers[PWR_REGEN_SOURCE] }).length;
            if (Game.cpu.bucket < 9500)
                pc++; //pc is used when there is EITHER a PC or low cpu
        }
    }
    const maxWorks = pc ? 25 : source && source.room.controller ? 6 : 10;
    works = Math.min(works, maxWorks);
    const energyAfterWorks = energyAvailable - works * BODYPART_COST[WORK];
    const moves = rcl >= 6 ? Math.floor(Math.min(Math.ceil(works / 2), Math.max(1, energyAfterWorks / BODYPART_COST[MOVE]))) : 0;
    const energyAfterMoves = energyAfterWorks - moves * BODYPART_COST[MOVE];
    const minCarries = energyAfterMoves / BODYPART_COST[CARRY] >= 1 ? 1 : 0;
    // Figure out how many carries we can afford/will fill the link in fewest ticks
    const carriesPerLinkFill = Game.cpu.bucket < 9500 ? Math.ceil(LINK_CAPACITY / CARRY_CAPACITY) : Math.ceil(LINK_CAPACITY / CARRY_CAPACITY) / 4;
    const loadsNeeded = (c => c <= 0 ? Infinity : Math.ceil(carriesPerLinkFill / c));
    const storeChoices = [...Array(carriesPerLinkFill + 1).keys()] // range [0,n + 1]
        .filter(c => loadsNeeded(c) < loadsNeeded(c - 1)) // more carries => fewer loads?
        .filter(c => c <= energyAfterMoves / BODYPART_COST[CARRY]) // how many can we afford?
        .filter(c => works + c + moves <= MAX_CREEP_SIZE);
    let carries = rcl >= 6 ? Math.max(...storeChoices, minCarries) : minCarries;
    if (source && source.room.name != room.name)
        carries = Math.min(carries, 1);
    return body([works, carries, moves], [WORK, CARRY, MOVE]);
}
function upgraderBody(energyAvailable, rcl, room) {
    const controller = room.controller;
    const isBoosted = controller.effects && controller.effects.length > 0;
    const boost = isBoosted ?
        POWER_INFO[PWR_OPERATE_CONTROLLER].effect[controller.effects[0].level - 1] : 0;
    const maxWorks = CONTROLLER_MAX_UPGRADE_PER_TICK + boost;
    const types = [WORK, CARRY, MOVE];
    if (rcl > 4 && rcl < 8) { // use boost ratio 5 work, 3 store
        return scalingBody([4, 1, 1], types, energyAvailable);
    }
    else if (isBoosted) {
        return scalingBody([4, 1, 1], types, energyAvailable, Math.min(maxWorks * 1.5, MAX_CREEP_SIZE));
    }
    else if (rcl == 8) { // don't go over 15 work for rcl8
        return scalingBody([5, 1, 2], types, energyAvailable, 24);
    }
    else if (energyAvailable >= 400) {
        return scalingBody([3, 1, 1], types, energyAvailable);
    }
    else {
        return scalingBody([1, 1, 1], types, energyAvailable);
    }
}
function builderBody(energyAvailable, rcl) {
    let ratio = [2, 1, 1]; // ratio at rcl1
    const ratio4 = [5, 9, 7];
    const ratio7 = [15, 18, 17];
    const types = [WORK, CARRY, MOVE];
    if (rcl >= 2)
        return scalingBody([1, 1, 1], types, energyAvailable);
    if (rcl >= 4 && energyAvailable > cost(body(ratio4, types)))
        ratio = ratio4;
    if (rcl >= 7 && energyAvailable > cost(body(ratio7, types)))
        ratio = ratio7;
    return body(ratio, types);
}
function reserverBody(energyAvailable) {
    return scalingBody([1, 1], [MOVE, CLAIM], energyAvailable, 12);
}
function quadBody(energyAvailable, rcl, room, boosted) {
    if (boosted) {
        //make boosted variant
        if (rcl == 8) {
            return body([2, 18, 9, 8, 1, 12], [TOUGH, RANGED_ATTACK, MOVE, TOUGH, MOVE, HEAL]);
        }
        if (rcl == 7) {
            const ratio = [1, 4, 1, 1, 1, 2];
            const types = [TOUGH, RANGED_ATTACK, MOVE, TOUGH, MOVE, HEAL];
            return scalingBody(ratio, types, energyAvailable);
        }
    }
    //make unboosted variant
    const types = [RANGED_ATTACK, MOVE, HEAL];
    let ratio = [0, 1, 0];
    if (energyAvailable < 550) //rcl1
        ratio = [1, 1, 0];
    else if (energyAvailable < 800) //rcl2
        ratio = [1, 2, 1];
    else if (energyAvailable < 1300) //rcl3
        ratio = [2, 3, 1];
    else if (energyAvailable < 1800) //rcl4
        ratio = [5, 6, 1];
    else if (energyAvailable < 2300) //rcl5
        ratio = [3, 4, 1];
    else if (energyAvailable < 5600) //rcl6
        ratio = [4, 9, 5];
    else if (energyAvailable < 10000) //rcl7
        ratio = [10, 22, 12];
    else //rcl8
        ratio = [13, 25, 12];
    return scalingBody(ratio, types, energyAvailable);
}
function defenderBody(energyAvailable, rcl, boosted) {
    if (boosted) {
        if (rcl == 8) {
            return body([6, 22, 10, 12], [TOUGH, RANGED_ATTACK, MOVE, HEAL]);
        }
        if (rcl == 7) {
            return scalingBody([1, 9, 3, 2], [TOUGH, RANGED_ATTACK, MOVE, HEAL], energyAvailable);
        }
    }
    const ratio = [3, 4, 1];
    const types = [RANGED_ATTACK, MOVE, HEAL];
    const baseCost = cost(body(ratio, types));
    if (baseCost > energyAvailable) {
        return body([1, 1], [RANGED_ATTACK, MOVE]);
    }
    return scalingBody(ratio, types, energyAvailable);
}
function harasserBody(energyAvailable, boosted, rcl) {
    if (boosted) {
        if (rcl == 8)
            return body([3, 31, 10, 6], [TOUGH, RANGED_ATTACK, MOVE, HEAL]);
        if (rcl == 7)
            return scalingBody([1, 9, 3, 2], [TOUGH, RANGED_ATTACK, MOVE, HEAL], energyAvailable);
    }
    if (energyAvailable < 500) {
        return scalingBody([1, 1], [RANGED_ATTACK, MOVE], energyAvailable);
    }
    if (energyAvailable < 1100) {
        return scalingBody([1, 2, 1], [RANGED_ATTACK, MOVE, HEAL], energyAvailable);
    }
    return scalingBody([4, 5, 1], [RANGED_ATTACK, MOVE, HEAL], energyAvailable);
}
function breakerBody(energyAvailable, rcl, boosted) {
    if (!boosted) {
        return scalingBody([1, 1], [WORK, MOVE], energyAvailable);
    }
    if (rcl == 8)
        return body([16, 24, 10], [TOUGH, WORK, MOVE]);
    return scalingBody([1, 3, 1], [TOUGH, WORK, MOVE], energyAvailable);
}
function medicBody(energyAvailable, rcl, boosted) {
    if (!boosted) {
        return scalingBody([1, 1], [HEAL, MOVE], energyAvailable);
    }
    if (rcl == 8)
        return body([16, 24, 10], [TOUGH, HEAL, MOVE]);
    return scalingBody([1, 3, 1], [TOUGH, HEAL, MOVE], energyAvailable);
}
function repairerBody(energyAvailable) {
    return scalingBody([2, 4, 3], [WORK, CARRY, MOVE], energyAvailable, 27);
}
/** TODO support for fractional scaling
 * ratio: ratio of parts in an array. i.e. [2, 1, 2]
 * types: types of part in an array. Must be same length as ratio. i.e. [MOVE, CARRY, MOVE]
 * energyAvailable: energy to use on this creep
 * maxOverride: (optional) max number of body parts to use on this creep
 */
function scalingBody(ratio, types, energyAvailable, maxOverride) {
    const baseCost = cost(body(ratio, types));
    const maxSize = maxOverride || MAX_CREEP_SIZE;
    const energy = energyAvailable || 0;
    const scale = Math.max(Math.floor(Math.min(energy / baseCost, maxSize / _.sum(ratio))), 1);
    return body(ratio.map(x => x * scale), types);
}
var types = {
    getRecipe: getRecipe,
    cost: cost,
    store: store,
    body: body,
    depositMinerBody: depositMinerBody,
};

const rR = {
    name: creepNames.cN.RUNNER_NAME,
    type: 4 /* runner */,
    target: 0,
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.flag && creep.memory.flag.includes("powerMine")) {
            rR.runPower(creep);
            return;
        }
        if (creep.memory.juicer && rR.runController(creep)) {
            return;
        }
        if (creep.memory.tug) {
            rR.runTug(creep);
            return;
        }
        // notice if there's stuff next to you before wandering off!  
        if (Game.cpu.bucket > 9500 || Game.time % 2) {
            actions_1.notice(creep); // cost: 15% when running, so 7% now
        }
        if (creep.memory.mode == 1 && creep.store.getUsedCapacity() == 0)
            creep.memory.mode = 0;
        if (creep.memory.mode == 0 && creep.store.getFreeCapacity() < 0.5 * creep.store.getCapacity()) {
            creep.memory.mode = 1;
            creep.memory.targetId = null;
        }
        if (creep.memory.mode == 0 && !creep.memory.targetId) {
            rR.checkForPullees(creep);
            if (creep.memory.tug)
                return;
        }
        // if there's room for more energy, go find some more
        // else find storage
        if (creep.memory.mode == 0) {
            if (!rR.pickup(creep)) {
                rR.runController(creep);
            }
        }
        else {
            if (!creep.memory.location || !Game.getObjectById(creep.memory.location))
                creep.memory.location = roomUtils.getStorage(Game.spawns[creep.memory.city].room).id;
            const target = Game.getObjectById(creep.memory.location);
            if (target.store.energy < 2000 || !rR.runController(creep))
                rR.deposit(creep);
        }
    },
    flipTarget: function (creep) {
        creep.memory.mode = creepUtils.getNextLocation(creep.memory.mode, roomUtils.getTransferLocations(creep));
    },
    checkForPullees: function (creep) {
        const pullee = _.find(creep.room.find(FIND_MY_CREEPS), c => c.memory.destination && !c.memory.paired);
        if (pullee) {
            creep.memory.tug = true;
            creep.memory.pullee = pullee.id;
            pullee.memory.paired = creep.id;
        }
    },
    runController: function (creep) {
        if (creep.saying == "*" && creep.store.energy == 0) {
            creep.memory.juicer = false;
            return false;
        }
        const link = upgrader.getUpgradeLink(creep);
        if (!link)
            return false;
        if (!creep.memory.juicer && (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0 || creep.room.name != link.room.name))
            return false;
        if (creep.store.energy > 0) {
            if (!creep.memory.juicer || creep.saying == "*") {
                const spawnRoom = Game.spawns[creep.memory.city].room;
                if (!Tmp[spawnRoom.name]) {
                    Tmp[spawnRoom.name] = {};
                }
                if (!Tmp[spawnRoom.name].juicers && Tmp[spawnRoom.name].juicers != 0) {
                    const freeSpace = link.store.getFreeCapacity(RESOURCE_ENERGY);
                    const upgraders = _.filter(spawnRoom.find(FIND_MY_CREEPS), c => c.memory.role == upgrader.name).length;
                    const runnerRecipe = types.getRecipe(rR.type, spawnRoom.energyCapacityAvailable, spawnRoom);
                    const runnerCarry = runnerRecipe.filter(part => part == CARRY).length * CARRY_CAPACITY;
                    Tmp[spawnRoom.name].juicers = _.filter(creep.room.find(FIND_MY_CREEPS), c => c.memory.role == rR.name && c.memory.juicer).length;
                    Tmp[spawnRoom.name].juicersNeeded = Math.ceil((freeSpace - LINK_CAPACITY) / runnerCarry) + Math.floor(upgraders / 3);
                }
                if (Tmp[spawnRoom.name].juicers < Tmp[spawnRoom.name].juicersNeeded || (creep.saying == "*" && Tmp[spawnRoom.name].juicersNeeded > 0)) {
                    creep.memory.juicer = true;
                    if (creep.saying != "*")
                        Tmp[spawnRoom.name].juicers++;
                }
                else {
                    creep.memory.juicer = false;
                    return false;
                }
            }
            if (actions_1.charge(creep, link) == 1) {
                creep.say("*");
            }
        }
        else {
            if (!creep.memory.location || !Game.getObjectById(creep.memory.location))
                creep.memory.location = roomUtils.getStorage(Game.spawns[creep.memory.city].room).id;
            const target = Game.getObjectById(creep.memory.location);
            if (target.store.energy < 1500)
                return false;
            actions_1.withdraw(creep, target);
        }
        return true;
    },
    pickup: function (creep) {
        if (creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId);
            if (target) {
                if (!(target instanceof Resource)) {
                    const storeTarget = target;
                    let max = 0;
                    let maxResource = null;
                    for (const resource in storeTarget.store) {
                        if (storeTarget.store[resource] > max) {
                            max = storeTarget.store[resource];
                            maxResource = resource;
                        }
                    }
                    if (actions_1.withdraw(creep, target, maxResource) == 1)
                        creep.memory.targetId = null;
                }
                else {
                    if (actions_1.pick(creep, target) == 1)
                        creep.memory.targetId = null;
                }
                return true;
            }
        }
        const goodLoads = creepUtils.getGoodPickups(creep);
        const runners = _.filter(utils.splitCreepsByCity()[creep.memory.city], c => c.memory.role == rR.name);
        if (!goodLoads.length)
            return false;
        const newTarget = _.min(goodLoads, function (drop) {
            const distance = PathFinder.search(creep.pos, drop.pos).cost;
            let amount = drop.amount || drop.store.getUsedCapacity();
            for (const runner of runners) {
                if (runner.memory.targetId == drop.id)
                    amount -= runner.store.getFreeCapacity();
            }
            amount = Math.max(amount, 1);
            return distance / amount;
        });
        creep.memory.targetId = newTarget.id;
        return rR.pickup(creep);
    },
    deposit: function (creep) {
        if (!creep.memory.location || !Game.getObjectById(creep.memory.location))
            creep.memory.location = roomUtils.getStorage(Game.spawns[creep.memory.city].room).id;
        const target = Game.getObjectById(creep.memory.location);
        if (actions_1.charge(creep, target) == ERR_FULL)
            creep.memory.location = roomUtils.getStorage(Game.spawns[creep.memory.city].room).id;
    },
    runTug: function (creep) {
        const pullee = Game.getObjectById(creep.memory.pullee);
        if (!pullee) {
            creep.memory.tug = false;
            return;
        }
        if (creep.fatigue)
            return;
        const destination = new RoomPosition(pullee.memory.destination.x, pullee.memory.destination.y, pullee.memory.destination.roomName);
        if ((roomUtils.isOnEdge(creep.pos) && roomUtils.isNearEdge(pullee.pos)) || (roomUtils.isOnEdge(pullee.pos) && roomUtils.isNearEdge(creep.pos))) {
            rR.runBorderTug(creep, pullee, destination);
            return;
        }
        if (!pullee.pos.isNearTo(creep.pos)) {
            motion.newMove(creep, pullee.pos, 1);
            return;
        }
        if (creep.pos.isEqualTo(destination)) {
            creep.move(pullee);
            creep.pull(pullee);
            pullee.move(creep);
            creep.memory.tug = false;
            pullee.memory.paired = pullee.id;
            return;
        }
        else if (creep.ticksToLive == 1) {
            pullee.memory.paired = null;
        }
        const range = new RoomPosition(destination.x, destination.y, destination.roomName).isEqualTo(pullee.memory.sourcePos.x, pullee.memory.sourcePos.y) ? 1 : 0;
        motion.newMove(creep, destination, range);
        creep.pull(pullee);
        pullee.move(creep);
    },
    runBorderTug: function (creep, pullee, destination) {
        if (roomUtils.isOnEdge(creep.pos) && !roomUtils.isOnEdge(pullee.pos)) {
            creep.move(pullee);
            creep.pull(pullee);
            pullee.move(creep);
            return;
        }
        const endRoom = destination.roomName;
        const path = PathFinder.search(creep.pos, destination).path;
        let nextRoomDir = path[0].getDirectionTo(path[1]);
        if (nextRoomDir % 2 == 0) {
            nextRoomDir = Math.random() < 0.5 ? nextRoomDir - 1 : nextRoomDir + 1;
            if (nextRoomDir == 9)
                nextRoomDir = 1;
        }
        const nextRoom = Game.map.describeExits(creep.pos.roomName)[nextRoomDir];
        if (roomUtils.isOnEdge(creep.pos) && roomUtils.isOnEdge(pullee.pos)) {
            //_cp_
            //_pc_
            //_b__
            //__b_
            let direction = null;
            if (creep.pos.x == 0) {
                direction = RIGHT;
            }
            else if (creep.pos.x == 49) {
                direction = LEFT;
            }
            else if (creep.pos.y == 0) {
                direction = BOTTOM;
            }
            else {
                direction = TOP;
            }
            creep.move(direction);
            return;
        }
        const sameRoom = creep.pos.roomName == pullee.pos.roomName;
        let direction = null;
        if (pullee.pos.x == 0) {
            direction = LEFT;
        }
        else if (pullee.pos.x == 49) {
            direction = RIGHT;
        }
        else if (pullee.pos.y == 0) {
            direction = TOP;
        }
        else {
            direction = BOTTOM;
        }
        if (sameRoom && (creep.pos.roomName == endRoom || direction != nextRoomDir)) {
            if (!creep.pos.isNearTo(pullee.pos)) {
                motion.newMove(creep, pullee.pos, 1);
                return;
            }
            const range = new RoomPosition(destination.x, destination.y, destination.roomName).isEqualTo(pullee.memory.sourcePos.x, pullee.memory.sourcePos.y) ? 1 : 0;
            motion.newMove(creep, destination, range);
            creep.pull(pullee);
            pullee.move(creep);
            return;
        }
        if (!sameRoom && (pullee.pos.roomName == endRoom || pullee.pos.roomName == nextRoom)) {
            motion.newMove(creep, pullee.pos);
        }
        //cases
        //_p_c --> do nothing
        //cp__ --> do nothing
    },
    runPower: function (creep) {
        if (_.sum(creep.store) > 0) {
            if (!creep.memory.location) {
                creep.memory.location = Game.spawns[creep.memory.city].room.storage.id;
            }
            const target = Game.getObjectById(creep.memory.location);
            if (target) {
                actions_1.charge(creep, target);
            }
            return;
        }
        //check for flag
        const flagName = creep.memory.flag || creep.memory.city + "powerMine";
        const flag = Memory.flags[flagName];
        if (flag && flag.roomName !== creep.pos.roomName) {
            //move to flag range 5
            motion.newMove(creep, new RoomPosition(flag.x, flag.y, flag.roomName), 5);
            return;
        }
        if (flag) {
            const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
            //check for resources under flag
            const resource = Game.rooms[flag.roomName].lookForAt(LOOK_RESOURCES, flagPos);
            if (resource.length) {
                //pickup resource
                if (creep.pickup(resource[0]) == ERR_NOT_IN_RANGE) {
                    motion.newMove(creep, flagPos, 1);
                }
                return;
            }
            const ruin = Game.rooms[flag.roomName].lookForAt(LOOK_RUINS, flagPos);
            if (ruin.length) {
                //pickup resource
                if (creep.withdraw(ruin[0], RESOURCE_POWER) == ERR_NOT_IN_RANGE)
                    motion.newMove(creep, flagPos, 1);
                return;
            }
            //move to flag
            if (!creep.pos.inRangeTo(flagPos, 4))
                motion.newMove(creep, flagPos, 4);
            // every 50 ticks check for powerbank
            if (Game.time % 50 == 0) {
                const powerBank = Game.rooms[flag.roomName].lookForAt(LOOK_STRUCTURES, flagPos);
                // if no powerbank, remove flag
                if (!powerBank.length)
                    delete Memory.flags[flagName];
            }
            return;
        }
        if (Game.time % 50 == 0)
            creep.memory.flag = null;
    }
};
var runner_1 = rR;

const rT = {
    name: creepNames.cN.TRANSPORTER_NAME,
    type: 7 /* transporter */,
    /** @param {Creep} creep **/
    run: function (creep) {
        if (rT.endLife(creep)) {
            return;
        }
        if (parseInt(creep.saying) > 0 && creep.room.energyAvailable == creep.room.energyCapacityAvailable) {
            creep.say(String(parseInt(creep.saying) - 1));
            return;
        }
        if (creep.store.energy == 0) {
            //refill on energy
            if (rT.refill(creep) === 1) {
                //start moving to target
                const target = rT.findTarget(creep, null);
                rT.moveToTargetIfPresent(creep, target);
            }
        }
        else {
            const target = rT.findTarget(creep, null);
            if (!target) {
                creep.say(String(30));
                return;
            }
            const result = actions_1.charge(creep, target, false);
            if (result === 1 || !rT.needsEnergy(target)) { //successful deposit
                const extra = creep.store[RESOURCE_ENERGY] - target.store.getFreeCapacity(RESOURCE_ENERGY);
                if (extra >= 0 || target.store.getUsedCapacity(RESOURCE_ENERGY) >= 10000) {
                    //make sure to remove current target from search list
                    const newTarget = rT.findTarget(creep, target);
                    //if creep still has energy, start moving to next target
                    if (extra > 0) {
                        rT.moveToTargetIfPresent(creep, newTarget);
                    }
                    else {
                        //start moving to storage already
                        rT.refill(creep);
                    }
                }
            }
        }
    },
    moveToTargetIfPresent: function (creep, target) {
        if (!target) {
            creep.say(0);
            return;
        }
        //start moving to next target if target not already in range
        if (!target.pos.isNearTo(creep.pos)) {
            const boundingBox = motion.getBoundingBox(creep.room);
            motion.newMove(creep, target.pos, 1, true, boundingBox);
        }
    },
    findTarget: function (creep, oldTarget) {
        const ccache = utils.getCreepCache(creep.id);
        if (ccache.target && !oldTarget) {
            const cachedTarget = Game.getObjectById(ccache.target);
            if (rT.needsEnergy(cachedTarget)) {
                return cachedTarget;
            }
        }
        const targets = _(rT.getTargets(creep, oldTarget))
            .map(Game.getObjectById)
            .value();
        ccache.target = creep.pos.findClosestByRange(targets);
        return ccache.target;
    },
    getTargets: function (creep, oldTarget) {
        const rcache = utils.getRoomCache(creep.room.name);
        const refillTargets = utils.getsetd(rcache, "refillTargets", []);
        const unused = _(refillTargets)
            .filter(id => !oldTarget || id != oldTarget.id)
            .value();
        if (unused.length && !rT.missingTargets(unused, creep.room)) {
            rcache.refillTargets = unused;
        }
        else {
            rcache.refillTargets = rT.emptyTargets(creep.room);
        }
        return rcache.refillTargets;
    },
    missingTargets: function (cachedTargets, room) {
        const rcl = room.controller.level;
        const missingEnergy = room.energyCapacityAvailable - room.energyAvailable;
        const cachedTargetsEnergy = cachedTargets.length * EXTENSION_ENERGY_CAPACITY[rcl];
        return missingEnergy - cachedTargetsEnergy > 1000;
    },
    emptyTargets: function (room) {
        return _(room.find(FIND_MY_STRUCTURES))
            .filter(rT.needsEnergy)
            .map("id")
            .value();
    },
    needsEnergy: function (structure) {
        if (!structure) {
            return false;
        }
        const store = structure.store;
        switch (structure.structureType) {
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_LAB:
            case STRUCTURE_NUKER:
                //if there is any room for energy, needs energy
                return (store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            case STRUCTURE_TOWER:
            case STRUCTURE_POWER_SPAWN:
                //arbitrary buffer
                return (store.getFreeCapacity(RESOURCE_ENERGY) > 400);
            case STRUCTURE_FACTORY:
                //arbitrary max value
                return (store.getUsedCapacity(RESOURCE_ENERGY) < 10000);
            default:
                return false;
        }
    },
    endLife: function (creep) {
        if (creep.ticksToLive == 200) {
            const transporters = _.filter(creep.room.find(FIND_MY_CREEPS), c => c.memory.role == "transporter");
            if (transporters.length < 2) {
                spawnQueue.respawn(creep);
            }
        }
        if (creep.ticksToLive > 10 || !creep.room.storage) {
            return false;
        }
        if (creep.store.getUsedCapacity() > 0) {
            actions_1.charge(creep, creep.room.storage);
        }
        else {
            creep.suicide();
        }
        return true;
    },
    refill: function (creep) {
        let result = 0;
        if (Game.getObjectById(creep.memory.location)) {
            const bucket = Game.getObjectById(creep.memory.location);
            if (creep.store.getUsedCapacity() > 0) {
                if (!creep.pos.isNearTo(bucket.pos)) {
                    motion.newMove(creep, bucket.pos, 1);
                }
                return result;
            }
            result = actions_1.withdraw(creep, bucket);
            if (result == ERR_NOT_ENOUGH_RESOURCES || bucket.structureType == STRUCTURE_SPAWN) {
                creep.memory.location = roomUtils.getStorage(creep.room).id;
            }
        }
        else {
            const location = roomUtils.getStorage(creep.room);
            creep.memory.location = location.id;
            if (creep.store.getUsedCapacity() > 0) {
                if (!creep.pos.isNearTo(location.pos)) {
                    motion.newMove(creep, location.pos, 1);
                }
                return result;
            }
            result = actions_1.withdraw(creep, location);
        }
        return result;
    }
};
var transporter = rT;

const rM = {
    name: creepNames.cN.REMOTE_MINER_NAME,
    type: 5 /* miner */,
    run: function (creep) {
        if (creep.spawning) {
            return;
        }
        rM.checkRespawn(creep);
        if (rM.retreat(creep))
            return;
        if (creep.memory.paired && !Game.getObjectById(creep.memory.paired))
            creep.memory.paired = null;
        if (!creep.memory.source || !creep.memory.sourcePos) {
            rM.nextSource(creep);
            return;
        }
        const source = Game.getObjectById(creep.memory.source);
        rM.setMoveStatus(creep);
        rM.maybeMove(creep, source);
        if (!source)
            return;
        if (creep.memory.construction && rM.build(creep, source))
            return;
        if (creep.memory.link) {
            const link = Game.getObjectById(creep.memory.link);
            if (link) {
                if (source.energy > 0 && creep.store.getFreeCapacity() > 0)
                    creep.harvest(source);
                if (!creep.store.getFreeCapacity())
                    actions_1.charge(creep, link);
                return;
            }
            else {
                creep.memory.link = null;
            }
        }
        else if (creep.memory.container) {
            const container = Game.getObjectById(creep.memory.container);
            if (container) {
                if (container.hits < container.hitsMax * 0.3 && creep.store.getUsedCapacity() > 0 && !creep.store.getFreeCapacity()) {
                    creep.repair(container);
                }
                else if (source.energy > 0 && (container.store.getFreeCapacity() > 0 || creep.store.getFreeCapacity() > 0)) {
                    creep.harvest(source);
                }
                else if (container.hits < container.hitsMax * 0.9 && creep.store.getUsedCapacity() > 0) {
                    creep.repair(container);
                }
            }
            else {
                creep.memory.container = null;
            }
        }
        else if (source.energy > 0) {
            creep.harvest(source);
        }
        if (Game.time % settings_1.minerUpdateTime == 0) {
            if (creep.pos.isNearTo(source.pos) && !creep.memory.spawnBuffer) {
                creep.memory.spawnBuffer = PathFinder.search(Game.spawns[creep.memory.city].pos, source.pos).cost;
            }
            //update container/link status
            //if we have a link no need to search
            if (creep.memory.link && Game.getObjectById(creep.memory.link))
                return;
            //get Destination assigns structures/sites anyway so might as well reuse
            rM.getDestination(creep, source);
            if (!creep.memory.link && !creep.memory.container && !creep.memory.construction && creep.body.length > 5)
                rM.placeContainer(creep, source);
        }
    },
    checkRespawn: function (creep) {
        if (creep.ticksToLive == creep.memory.spawnBuffer + (creep.body.length * CREEP_SPAWN_TIME)) {
            const spawn = Game.spawns[creep.memory.city];
            const creeps = utils.splitCreepsByCity()[creep.memory.city];
            // 2 creeps needed, because one is still alive
            creepUtils.scheduleIfNeeded(creepNames.cN.REMOTE_MINER_NAME, 2, false, spawn, creeps, creep.memory.flag);
        }
    },
    retreat: function (creep) {
        if (creep.memory.aware || creep.hits < creep.hitsMax || Game.time % 10 == 9) {
            creep.memory.aware = true;
            // if creep has a hostile within 15 spaces, become aware
            const hostiles = _.filter(utils.findHostileCreeps(creep.room), (c) => c.pos.getRangeTo(creep.pos) < 15);
            // check nearby sourcekeeper lairs
            const lair = _.find(creep.room.find(FIND_HOSTILE_STRUCTURES), (s) => s.structureType == STRUCTURE_KEEPER_LAIR && s.pos.getRangeTo(creep.pos) < 10);
            const dangerousLair = lair && lair.ticksToSpawn < 20;
            //lose awareness if no hostiles or lairs
            if (hostiles.length == 0 && !dangerousLair && creep.hits == creep.hitsMax) {
                creep.memory.aware = false;
            }
            else if (creep.pos.roomName == Game.spawns[creep.memory.city].pos.roomName) {
                Game.spawns[creep.memory.city].memory.towersActive = true;
            }
            // if creep has an enemy within 5 spaces, retreat
            const enemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
            if (dangerousLair) {
                enemies.push(lair);
            }
            if (enemies.length > 0) {
                motion.retreat(creep, enemies);
                return true;
            }
        }
        return false;
    },
    placeContainer: function (creep, source) {
        const spawn = Game.spawns[creep.memory.city];
        if (!spawn.memory.sources[source.id] || spawn.room.energyCapacityAvailable < 800 || Math.random() < 0.95)
            return;
        if (spawn.memory.sources[source.id][STRUCTURE_CONTAINER + "Pos"]) {
            const pos = spawn.memory.sources[source.id][STRUCTURE_CONTAINER + "Pos"];
            source.room.createConstructionSite(Math.floor(pos / 50), pos % 50, STRUCTURE_CONTAINER);
            return;
        }
        if (creep.memory.miningPos || creep.memory.destination) {
            const pos = creep.memory.miningPos || creep.memory.destination;
            if (creep.pos.isEqualTo(new RoomPosition(pos.x, pos.y, pos.roomName))) {
                spawn.memory.sources[source.id][STRUCTURE_CONTAINER + "Pos"] = creep.pos.x * 50 + creep.pos.y;
                creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
            }
        }
    },
    build: function (creep, source) {
        const cSite = Game.getObjectById(creep.memory.construction);
        if (!cSite) {
            creep.memory.construction = null;
            return false;
        }
        if (creep.store.getUsedCapacity() > creep.store.getCapacity() / 2) {
            creep.build(cSite);
        }
        else {
            creep.harvest(source);
        }
        return true;
    },
    maybeMove: function (creep, source) {
        if (creep.memory.moveStatus == "static") {
            if (!source) {
                creep.memory.destination = creep.memory.sourcePos;
                return;
            }
            if (!creep.memory.destination
                || new RoomPosition(creep.memory.destination.x, creep.memory.destination.y, creep.memory.destination.roomName).isEqualTo(creep.memory.sourcePos.x, creep.memory.sourcePos.y))
                creep.memory.destination = rM.getDestination(creep, source);
            return;
        }
        if (!source) {
            motion.newMove(creep, new RoomPosition(creep.memory.sourcePos.x, creep.memory.sourcePos.y, creep.memory.sourcePos.roomName), 1);
            return;
        }
        if (!creep.memory.miningPos) {
            creep.memory.miningPos = rM.getDestination(creep, source);
            if (!creep.memory.miningPos)
                return;
        }
        const miningPos = new RoomPosition(creep.memory.miningPos.x, creep.memory.miningPos.y, creep.memory.miningPos.roomName);
        if (!creep.pos.isEqualTo(miningPos))
            motion.newMove(creep, miningPos);
    },
    getLinkMiningPos: function (link, source) {
        for (let i = link.pos.x - 1; i <= link.pos.x + 1; i++) {
            for (let j = link.pos.y - 1; j <= link.pos.y + 1; j++) {
                const testPos = new RoomPosition(i, j, link.pos.roomName);
                if (testPos.isNearTo(source) && !rM.isPositionBlocked(testPos))
                    return testPos;
            }
        }
        return null;
    },
    getDestination: function (creep, source) {
        //look for links
        const link = rM.findStruct(creep, source, STRUCTURE_LINK);
        if (link) {
            creep.memory.link = link.id;
            return rM.getLinkMiningPos(link, source);
        }
        const linkSite = rM.findStruct(creep, source, STRUCTURE_LINK, true);
        if (linkSite) {
            creep.memory.construction = linkSite.id;
            return rM.getLinkMiningPos(linkSite, source);
        }
        //look for containers
        const container = rM.findStruct(creep, source, STRUCTURE_CONTAINER);
        if (container) {
            creep.memory.container = container.id;
            return container.pos;
        }
        const containerSite = rM.findStruct(creep, source, STRUCTURE_CONTAINER, true);
        if (containerSite) {
            creep.memory.construction = containerSite.id;
            return containerSite.pos;
        }
        //look for empty space to mine
        for (let i = source.pos.x - 1; i <= source.pos.x + 1; i++) {
            for (let j = source.pos.y - 1; j <= source.pos.y + 1; j++) {
                if (!rM.isPositionBlocked(new RoomPosition(i, j, source.pos.roomName)))
                    return new RoomPosition(i, j, source.pos.roomName);
            }
        }
    },
    findStruct: function (creep, source, structureType, construction = false) {
        const type = construction ? LOOK_CONSTRUCTION_SITES : LOOK_STRUCTURES;
        const memory = Game.spawns[creep.memory.city].memory;
        if (!memory.sources[source.id])
            return null;
        const structPos = memory.sources[source.id][structureType + "Pos"];
        if (structPos) {
            const realPos = new RoomPosition(Math.floor(structPos / 50), structPos % 50, source.pos.roomName);
            const look = realPos.lookFor(type);
            const structure = _.find(look, struct => struct.structureType == structureType && (!(struct instanceof OwnedStructure) || struct.my));
            if (structure)
                return structure;
        }
        return null;
    },
    isPositionBlocked: function (roomPos) {
        const look = roomPos.look();
        for (const lookObject of look) {
            if ((lookObject.type == LOOK_TERRAIN
                && lookObject[LOOK_TERRAIN] == "wall") //no constant for wall atm
                || (lookObject.type == LOOK_STRUCTURES
                    && OBSTACLE_OBJECT_TYPES[lookObject[LOOK_STRUCTURES].structureType])) {
                return true;
            }
        }
        return false;
    },
    setMoveStatus: function (creep) {
        if (!creep.memory.moveStatus)
            creep.memory.moveStatus = creep.getActiveBodyparts(MOVE) ? "mobile" : "static";
    },
    canCarry: function (creep) {
        return creep.getActiveBodyparts(CARRY) > 0;
    },
    harvestTarget: function (creep) {
        const source = Game.getObjectById(creep.memory.source);
        if (!creep.pos.inRangeTo(source, 2)) {
            motion.newMove(creep, source.pos, 2);
            return;
        }
        if (creep.body.length === 15 && creep.pos.isNearTo(source) && Game.time % 2 === 0) {
            return;
        }
        if (actions_1.harvest(creep, source) === 1 && !creep.memory.spawnBuffer) {
            creep.memory.spawnBuffer = PathFinder.search(Game.spawns[creep.memory.city].pos, source.pos).cost;
        }
    },
    /** pick a target id for creep **/
    nextSource: function (creep) {
        if (creep.memory.flag) {
            const spawn = Game.spawns[creep.memory.city];
            roomUtils.initializeSources(spawn);
            creep.memory.source = creep.memory.flag;
            creep.memory.sourcePos = spawn.memory.sources[creep.memory.source];
            if (!creep.memory.sourcePos)
                creep.suicide();
        }
        else {
            creep.suicide();
        }
    }
};
var remoteMiner = rM;

const rRo = {
    name: creepNames.cN.ROBBER_NAME,
    type: 22 /* robber */,
    /** @param {Creep} creep **/
    run: function (creep) {
        const flagName = "steal";
        const flag = Memory.flags[flagName];
        if (creep.store.getUsedCapacity() == 0) {
            if (!flag) {
                creep.suicide();
                return;
            }
            if (creep.memory.flagDistance && creep.ticksToLive <= creep.memory.flagDistance) {
                creep.suicide();
                spawnQueue.respawn(creep);
                return;
            }
            //if creep can't complete round trip suicide and respawn
        }
        if (!creep.store.getUsedCapacity() || ((creep.pos.roomName != Game.spawns[creep.memory.city].pos.roomName && creep.store.getFreeCapacity()) && flag)) {
            //pick up more stuff
            const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
            if (!creep.memory.flagDistance) {
                const route = motion.getRoute(Game.spawns[creep.memory.city].pos.roomName, flag.roomName, true);
                if (route == -2) {
                    creep.memory.flagDistance = 1000;
                    return;
                }
                creep.memory.flagDistance = route.length * 50;
            }
            if (Game.rooms[flag.roomName]) {
                if (creep.memory.target) {
                    const target = Game.getObjectById(creep.memory.target);
                    if (!target.store[creep.memory.resource]) {
                        creep.memory.target = null;
                        creep.memory.resource = null;
                    }
                }
                if (!creep.memory.target) {
                    const structs = _.filter(flagPos.lookFor(LOOK_STRUCTURES).concat(flagPos.lookFor(LOOK_RUINS)), s => s.store);
                    for (const struct of structs) {
                        const valuables = _.filter(Object.keys(struct.store), k => k != RESOURCE_ENERGY);
                        if (valuables.length) {
                            creep.memory.target = struct.id;
                            creep.memory.resource = valuables[0];
                            break;
                        }
                    }
                }
                if (!creep.memory.target) {
                    delete Memory.flags[flagName];
                }
                else {
                    actions_1.withdraw(creep, Game.getObjectById(creep.memory.target), creep.memory.resource);
                }
            }
            else {
                motion.newMove(creep, flagPos, 1);
            }
        }
        else {
            actions_1.charge(creep, Game.spawns[creep.memory.city].room.storage);
        }
    }
};
var robber = rRo;

const rMM = {
    name: creepNames.cN.MINERAL_MINER_NAME,
    type: 23 /* mineralMiner */,
    run: function (creep) {
        rMM.contemplateSuicide(creep);
        rMM.getMineral(creep);
        if (rMM.canMine(creep)) {
            rMM.harvestMineral(creep);
        }
        else {
            const bucket = roomUtils.getStorage(creep.room);
            actions_1.charge(creep, bucket);
        }
    },
    // attempt to find a mineral
    getMineral: function (creep) {
        if (creep.memory.source)
            return;
        const targetRoom = creep.memory.flag || creep.pos.roomName;
        if (Game.rooms[targetRoom]) {
            const extractor = _.find(creep.room.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_EXTRACTOR);
            const mineral = extractor && _.find(extractor.pos.lookFor(LOOK_MINERALS));
            creep.memory.source = mineral && mineral.id;
        }
    },
    // suicide if not enough TTL to complete another job cycle
    contemplateSuicide: function (creep) {
        if (!creep.memory.source)
            return;
        const mineral = Game.getObjectById(creep.memory.source);
        if (!creep.memory.suicideTime) {
            const works = creep.getActiveBodyparts(WORK) * HARVEST_MINERAL_POWER;
            const carry = creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY;
            const ticksToFill = Math.ceil(carry / works * EXTRACTOR_COOLDOWN);
            const distance = PathFinder.search(Game.spawns[creep.memory.city].pos, { pos: mineral.pos, range: 1 }).path.length;
            creep.memory.suicideTime = distance + ticksToFill;
        }
        if (_.sum(Object.values(creep.store)) == 0
            && (creep.ticksToLive < creep.memory.suicideTime)) {
            creep.suicide();
        }
    },
    canMine: function (creep) {
        const hasCapacity = creep.store.getFreeCapacity();
        const source = creep.memory.source
            && Game.getObjectById(creep.memory.source);
        const sourceDepleted = !source || source.mineralAmount == 0;
        return hasCapacity && !sourceDepleted;
    },
    harvestMineral: function (creep) {
        const source = Game.getObjectById(creep.memory.source);
        if (source) {
            actions_1.harvest(creep, source);
        }
        else if (creep.memory.flag) {
            motion.newMove(creep, new RoomPosition(25, 25, creep.memory.flag), 24);
        }
        else {
            Log.error(`MineralMiner at ${creep.pos} unable to find target`);
        }
    },
};
var mineralMiner = rMM;

const rS = {
    name: creepNames.cN.SCOUT_NAME,
    type: 2 /* scout */,
    run: function (creep) {
        const targetRoom = Memory.creeps[creep.name].targetRoom;
        if (!targetRoom || creep.room.name == targetRoom
            || (Cache.roomData && Cache.roomData[targetRoom] && Cache.roomData[targetRoom].sct > Game.time))
            rS.getNextTarget(creep);
        if (Memory.creeps[creep.name].targetRoom)
            motion.newMove(creep, new RoomPosition(25, 25, Memory.creeps[creep.name].targetRoom), 24);
    },
    getNextTarget: function (creep) {
        const rcache = utils.getRoomCache(Game.spawns[creep.memory.city].pos.roomName);
        const targets = utils.getsetd(rcache, "scannerTargets", []);
        if (targets.length) {
            Memory.creeps[creep.name].targetRoom = targets.shift();
            return;
        }
        creep.suicide();
    }
};
var scout = rS;

const rRe = {
    name: creepNames.cN.REPAIRER_NAME,
    type: 12 /* repairer */,
    /** @param {Creep} creep **/
    run: function (creep) {
        if (!creep.memory.repPower) {
            creep.memory.repPower = REPAIR_POWER * creep.getActiveBodyparts(WORK);
        }
        builder.decideWhetherToBuild(creep);
        if (creep.memory.building) {
            if (!rRe.build(creep))
                rRe.repair(creep);
        }
        else {
            runner_1.pickup(creep);
        }
    },
    repair: function (creep) {
        const needRepair = rRe.findRepair(creep);
        if (needRepair) {
            creep.memory.repair = needRepair.id;
            if (creep.repair(needRepair) == ERR_NOT_IN_RANGE) {
                motion.newMove(creep, needRepair.pos, 1);
                rRe.closeRepair(creep);
            }
        }
    },
    build: function (creep) {
        if (creep.memory.build) {
            const site = Game.getObjectById(creep.memory.build);
            if (site) {
                if (creep.build(site) === ERR_NOT_IN_RANGE) {
                    motion.newMove(creep, site.pos, 1);
                    rRe.closeRepair(creep);
                }
                return true;
            }
            else {
                creep.memory.build = null;
            }
        }
        if (!creep.memory.nextCheckTime || creep.memory.nextCheckTime < Game.time) { //occasionally scan for construction sites
            const runners = _.filter(utils.splitCreepsByCity()[creep.memory.city], c => c.memory.role == runner_1.name);
            const rooms = Object.keys(_.countBy(runners, s => s.pos.roomName));
            let targets = [];
            for (let i = 0; i < rooms.length; i++) {
                if (Game.rooms[rooms[i]])
                    targets = targets.concat(Game.rooms[rooms[i]].find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType == STRUCTURE_ROAD }));
            }
            targets = targets.concat(creep.room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType == STRUCTURE_ROAD }));
            if (targets.length) {
                creep.memory.build = _.min(targets, s => utils.getRangeTo(creep.pos, s.pos)).id;
                return true;
            }
            creep.memory.nextCheckTime = Game.time + 200;
        }
        return false;
    },
    closeRepair: function (creep) {
        const target = _.find(creep.pos.findInRange(FIND_STRUCTURES, 3), s => s.hits && s.hitsMax - s.hits > creep.memory.repPower);
        if (target) {
            creep.repair(target);
        }
        else {
            const sites = creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3);
            if (sites.length) {
                creep.build(sites[0]);
            }
        }
    },
    findRepair: function (creep) {
        if (creep.memory.repair) {
            const target = Game.getObjectById(creep.memory.repair);
            if (target)
                return target;
        }
        const runners = _.filter(utils.splitCreepsByCity()[creep.memory.city], c => c.memory.role == runner_1.name);
        const rooms = Object.keys(_.countBy(runners, s => s.pos.roomName));
        let targets = [];
        for (let i = 0; i < rooms.length; i++)
            if (Game.rooms[rooms[i]])
                targets = targets.concat(Game.rooms[rooms[i]].find(FIND_STRUCTURES, { filter: s => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits && s.hits / s.hitsMax < 0.3 }));
        targets = targets.concat(creep.room.find(FIND_STRUCTURES, { filter: s => s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART && s.hits && s.hits / s.hitsMax < 0.3 }));
        if (targets.length) {
            return _.min(targets, s => utils.getRangeTo(creep.pos, s.pos));
        }
        return false;
    }
};
var repairer = rRe;

const rQr = {
    name: creepNames.cN.QR_CODE_NAME,
    type: 2 /* scout */,
    target: 0,
    run: function (creep) {
        const flag = Memory.flags[creep.memory.flag];
        if (!flag)
            return;
        const localCreeps = utils.splitCreepsByCity()[creep.memory.city];
        const qrs = _.filter(localCreeps, c => c.memory.role == rQr.name);
        if (creep.memory.row === undefined) {
            let freeRow = null;
            for (let i = 0; i < template.qrCoords.length; i++) {
                if (!_.find(qrs, c => c.memory.row == i && c.memory.mode == 0)) {
                    freeRow = i;
                    break;
                }
            }
            if (freeRow === null) {
                const targetPos = new RoomPosition(Math.max(flag.x - 2, 0), Math.max(flag.x - 2, 0), flag.roomName);
                if (!creep.pos.isEqualTo(targetPos))
                    motion.newMove(creep, targetPos);
                return;
            }
            creep.memory.row = freeRow;
        }
        const row = creep.memory.row;
        while (creep.memory.mode < template.qrCoords[row].length - 1
            && !_.find(qrs, c => c.memory.row == row && c.memory.target == creep.memory.target + 1)) {
            creep.memory.mode++;
        }
        const target = template.qrCoords[row][creep.memory.target];
        const targetPos = new RoomPosition(target.x + flag.x, target.y + flag.y, flag.roomName);
        if (!creep.pos.isEqualTo(targetPos))
            motion.newMove(creep, targetPos);
    }
};
var qrCode = rQr;

const rRr = {
    name: creepNames.cN.RESERVER_NAME,
    type: 1 /* reserver */,
    run: function (creep) {
        const targetRoom = creep.memory.flag;
        if (Game.rooms[targetRoom]) {
            if (Game.rooms[targetRoom].controller.pos.isNearTo(creep.pos)) {
                if (Game.rooms[targetRoom].controller.reservation && Game.rooms[targetRoom].controller.reservation.username != settings_1.username) {
                    creep.attackController(Game.rooms[targetRoom].controller);
                }
                else {
                    creep.reserveController(Game.rooms[targetRoom].controller);
                }
            }
            else {
                motion.newMove(creep, Game.rooms[targetRoom].controller.pos, 1);
            }
        }
        else {
            motion.newMove(creep, new RoomPosition(25, 25, targetRoom), 24);
        }
    }
};
var reserver = rRr;

const rBk = {
    name: creepNames.cN.BRICK_NAME,
    type: 0 /* brick */,
    run: function (creep) {
        if (creep.memory.target) {
            const target = Game.getObjectById(creep.memory.target);
            if (target) {
                actions_1.attack(creep, target);
                return;
            }
        }
        const targetRoom = creep.memory.flag;
        if (Game.rooms[targetRoom] && creep.room.name == targetRoom) {
            const hostileStructures = Game.rooms[targetRoom].find(FIND_HOSTILE_STRUCTURES);
            if (hostileStructures.length) {
                console.log(hostileStructures)
                const newTarget = creep.pos.findClosestByPath(hostileStructures);
                actions_1.attack(creep, newTarget);
                creep.memory.target = newTarget.id;
            }
        }
        else {
            motion.newMove(creep, new RoomPosition(25, 25, targetRoom), 24);
        }
    }
};
var brick = rBk;

const rSK = {
    name: creepNames.cN.SK_GUARD_NAME,
    type: 25 /* sKguard */,
    run: function (creep) {
        rSK.healAndShoot(creep);
        if (creep.memory.target) {
            const target = Game.getObjectById(creep.memory.target);
            if (target) {
                motion.newMove(creep, target.pos, 1);
                return;
            }
        }
        const targetRoom = creep.memory.flag;
        if (Game.rooms[targetRoom]) {
            const room = Game.rooms[targetRoom];
            const sourceKeeper = _.find(utils.findHostileCreeps(room), c => c.owner.username == "Source Keeper");
            if (sourceKeeper) {
                motion.newMove(creep, sourceKeeper.pos, 1);
                creep.memory.target = sourceKeeper.id;
            }
            else {
                //find source keeper spawners
                const sKSpawners = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_KEEPER_LAIR });
                // sort spawners by respawn time
                const nextSpawn = _.sortBy(sKSpawners, s => s.ticksToSpawn)[0];
                // move to spawner
                motion.newMove(creep, nextSpawn.pos, 1);
            }
        }
        else {
            motion.newMove(creep, new RoomPosition(25, 25, targetRoom), 24);
        }
    },
    healAndShoot: function (creep) {
        const meleeTarget = _.find(utils.findHostileCreeps(creep.room), c => c.pos.isNearTo(creep.pos));
        const rangedTarget = _.find(utils.findHostileCreeps(creep.room), c => c.pos.getRangeTo(creep.pos) <= 3);
        if (meleeTarget) {
            if (meleeTarget instanceof Creep && meleeTarget.getActiveBodyparts(ATTACK) > 0) {
                creep.rangedMassAttack();
            }
            else {
                creep.attack(meleeTarget);
            }
        }
        else if (rangedTarget) {
            creep.rangedAttack(rangedTarget);
        }
        if (creep.hits < creep.hitsMax || rangedTarget) {
            creep.heal(creep);
        }
        else {
            // find injured friendlies
            const injuredFriendlies = _.filter(utils.findFriendlyCreeps(creep.room), c => c.hits < c.hitsMax && c.pos.inRangeTo(creep.pos, 3));
            const nearFriendly = _.find(injuredFriendlies, c => c.pos.isNearTo(creep.pos));
            if (nearFriendly) {
                creep.heal(nearFriendly);
            }
            else if (injuredFriendlies.length) {
                creep.rangedHeal(injuredFriendlies[0]);
            }
        }
    }
};
var sKguard = rSK;

const rr = {
    // order roles for priority. TODO powercreep?
    getRoles: function () {
        return [ferry, defender, transporter, remoteMiner, runner_1, upgrader, builder, quad, mineralMiner, claimer, unclaimer,
            spawnBuilder, harasser, medic, breaker, powerMiner,
            robber, depositMiner, scout, qrCode, repairer, reserver, brick, sKguard];
    },
    getCoreRoles: function () {
        return [ferry, defender, transporter, remoteMiner, runner_1, upgrader, builder];
    },
    getEmergencyRoles: function () {
        return [ferry, defender, transporter, remoteMiner, runner_1];
    }
};
var roles = rr;

const labs = {
    //new labs:
    //all 10 labs in one cluster. reactors built first and identified based on position relative to other lab SITES
    //receivers are identified and begin use as soon as they are built
    //reactors are in a list in labInfo.reactors
    //receivers are in a list in labInfo.receivers
    //receivers have a mineral attribute. if null or undefined, operate as normal
    //if receiver has a mineral assigned in its mineral attribute, don't react into it, and use it for boosting (with assigned mineral)
    //fill codes:
    //  0: do nothing
    //  [positive integer]: fill with integer * 1000 resource
    //  -1: empty
    /* Example:
    labInfo:
        boost: [RESOURCE_CONSTANT]
        reactors:
            0:
                id: reactorId
                mineral: [RESOURCE_CONSTANT]
                fill: 0
            1:
                id: reactorId
                mineral: [RESOURCE_CONSTANT]
                fill: 0
        receivers
            0:
                id: [object Id]
                boost: [RESOURCE_CONSTANT]
                fill: 1
            1:
            .
            .
            .
    */
    run: function (city) {
        const spawn = Game.spawns[city];
        if (!spawn.memory.ferryInfo || !spawn.memory.ferryInfo.labInfo || !spawn.memory.ferryInfo.labInfo.reactors) {
            return;
        }
        if (spawn.memory.ferryInfo.labInfo.boost == "dormant" && Game.time % 1000 != 0) {
            return;
        }
        //if a reactor is missing, return
        const reactor0 = Game.getObjectById(Object.keys(spawn.memory.ferryInfo.labInfo.reactors)[0]);
        const reactor1 = Game.getObjectById(Object.keys(spawn.memory.ferryInfo.labInfo.reactors)[1]);
        if (!reactor0 || !reactor1 || !spawn.room.terminal) {
            return;
        }
        //if reactors are empty, choose next reaction, set all receivers to get emptied
        if (!reactor0.mineralType || !reactor1.mineralType) {
            //if reactors are not requesting fill, update reaction
            labs.updateLabs(reactor0, reactor1, spawn);
            return;
        }
        if (spawn.memory.ferryInfo.labInfo.boost) {
            //loop thru receivers, react in each one that is not designated as a booster
            labs.runReaction(spawn.memory.ferryInfo.labInfo.receivers, reactor0, reactor1);
        }
    },
    updateLabs: function (reactor0, reactor1, spawn) {
        if (spawn.memory.ferryInfo.labInfo.reactors[reactor0.id].fill || spawn.memory.ferryInfo.labInfo.reactors[reactor1.id].fill) {
            if (Game.time % 200000 == 0) {
                spawn.memory.ferryInfo.labInfo.reactors[reactor0.id].fill = -1;
                spawn.memory.ferryInfo.labInfo.reactors[reactor1.id].fill = -1;
            }
            return; //if either of the reactors is requesting a fill up, no need to choose a new mineral
        }
        if (reactor0.mineralType || reactor1.mineralType) {
            spawn.memory.ferryInfo.labInfo.reactors[reactor0.id].fill = -1;
            spawn.memory.ferryInfo.labInfo.reactors[reactor1.id].fill = -1;
            return;
        }
        //if that is not the case, all receivers must be emptied
        let oldMineral = null;
        for (let i = 0; i < Object.keys(spawn.memory.ferryInfo.labInfo.receivers).length; i++) {
            const receiver = Game.getObjectById(Object.keys(spawn.memory.ferryInfo.labInfo.receivers)[i]);
            if (!spawn.memory.ferryInfo.labInfo.receivers[receiver.id].boost && receiver.mineralType) {
                //empty receivers if they are not boosters and have minerals
                spawn.memory.ferryInfo.labInfo.receivers[receiver.id].fill = -1;
                //record mineral that was produced
                if (receiver.mineralType) {
                    oldMineral = receiver.mineralType;
                }
            }
        }
        if (oldMineral == spawn.memory.ferryInfo.labInfo.boost || !spawn.memory.ferryInfo.labInfo.boost
            || spawn.memory.ferryInfo.labInfo.boost == "dormant") {
            labs.chooseBoost(oldMineral, spawn);
            if (spawn.memory.ferryInfo.labInfo.boost == "dormant") {
                return;
            }
        }
        //choose new mineral to be made
        spawn.room.terminal.store[oldMineral] += 3000;
        const boost = spawn.memory.ferryInfo.labInfo.boost;
        const minerals = labs.chooseMineral(boost, spawn);
        if (!minerals) {
            return;
        }
        Object.values(spawn.memory.ferryInfo.labInfo.reactors)[0].mineral = minerals[0];
        Object.values(spawn.memory.ferryInfo.labInfo.reactors)[1].mineral = minerals[1];
        Object.values(spawn.memory.ferryInfo.labInfo.reactors)[0].fill = 3;
        Object.values(spawn.memory.ferryInfo.labInfo.reactors)[1].fill = 3;
    },
    chooseBoost: function (currentBoost, spawn) {
        const minBoost = _.min(settings_1.militaryBoosts, function (boost) {
            return spawn.room.storage.store[boost] || 0 + spawn.room.terminal.store[boost] || 0;
        });
        if (spawn.room.storage.store[minBoost] < settings_1.boostAmount) {
            spawn.memory.ferryInfo.labInfo.boost = minBoost;
            return;
        }
        for (const boost of settings_1.civBoosts) {
            if (boost == currentBoost && spawn.room.storage.store[currentBoost] > settings_1.boostAmount - 3000) {
                continue;
            }
            if (spawn.room.storage.store[boost] < settings_1.boostAmount) {
                spawn.memory.ferryInfo.labInfo.boost = boost;
                return;
            }
        }
        //go dormant
        spawn.memory.ferryInfo.labInfo.boost = "dormant";
    },
    runReaction: function (receivers, reactor0, reactor1) {
        if (reactor0.mineralType && reactor1.mineralType) {
            const produce = REACTIONS[reactor0.mineralType][reactor1.mineralType];
            const reactionTime = REACTION_TIME[produce];
            if (Game.time % reactionTime === 4 && Game.cpu.bucket > 2000) {
                const receiverList = Object.keys(receivers);
                for (let i = 0; i < receiverList.length; i++) {
                    const lab = Game.getObjectById(receiverList[i]);
                    if (lab) {
                        if (!receivers[receiverList[i]].boost) {
                            lab.runReaction(reactor0, reactor1);
                            continue;
                        }
                        if (!lab.mineralType && !receivers[receiverList[i]].fill) {
                            receivers[receiverList[i]].boost = null;
                            continue;
                        }
                        const labCache = utils.getLabCache(receiverList[i]);
                        if (labCache.amount != lab.store[lab.mineralType]) {
                            labCache.amount = lab.store[lab.mineralType];
                            labCache.lastUpdate = Game.time;
                            continue;
                        }
                        if (labCache.lastUpdate < Game.time - CREEP_LIFE_TIME && !receivers[receiverList[i]].fill) {
                            receivers[receiverList[i]].boost = null;
                            receivers[receiverList[i]].fill = -1;
                        }
                    }
                }
            }
            return 0;
        }
        return -1;
    },
    chooseMineral: function (mineral, spawn) {
        //if requesting mineral, early return
        if (spawn.memory.ferryInfo.mineralRequest) {
            if (Game.time % 50 == 26) {
                spawn.memory.ferryInfo.mineralRequest = null;
            }
            return 0;
        }
        const ingredients = labs.findIngredients(mineral);
        //if no ingredients, request mineral
        if (!ingredients) {
            spawn.memory.ferryInfo.mineralRequest = mineral;
            return 0;
        }
        const ferry = _.find(spawn.room.find(FIND_MY_CREEPS), creep => creep.memory.role === "ferry");
        if (ferry && _.sum(Object.values(ferry.store))) {
            return;
        }
        //if we don't have both ingredients find the one we don't have and find it's ingredients
        for (let i = 0; i < 2; i++) {
            if (spawn.room.terminal.store[ingredients[i]] < 3000) {
                return labs.chooseMineral(ingredients[i], spawn);
            }
        }
        //if we have both ingredients, load them up
        return ingredients;
    },
    findIngredients: function (mineral) {
        let result = null;
        _.forEach(Object.keys(REACTIONS), function (key) {
            _.forEach(Object.keys(REACTIONS[key]), function (key2) {
                if (REACTIONS[key][key2] == mineral) {
                    result = [key, key2];
                }
            });
        });
        return result;
    }
};
var labs_1 = labs;

const error = {
    errorThisTick: false,
    exception: null,
    reset: function () {
        error.errorThisTick = false;
        error.exception = null;
    },
    reportError: function (exception) {
        error.errorThisTick = true;
        error.exception = exception;
    },
    finishTick: function () {
        if (error.errorThisTick) {
            const e = error.exception;
            Log.error(`${e.message}: ${e.stack}`);
            Game.notify(`${e.message}: ${e.stack}`);
        }
    }
};
var error_1 = error;

const p = {
    frequency: 2000,
    tick: 0,
    sites: 0,
    judgeNextRoom: function () {
        if (!Cache.roomData)
            return true;
        const roomData = Cache.roomData;
        const nextRoom = _.find(Object.keys(roomData), roomName => roomData[roomName].ctrlP && !roomData[roomName].s);
        if (nextRoom) {
            p.scoreRoom(nextRoom);
            return false;
        }
        p.expand();
        return true;
    },
    scoreRoom: function (roomName) {
        const roomData = Cache.roomData[roomName];
        if (Object.keys(roomData.src).length < 2) {
            roomData.s = -1;
            return;
        }
        const terrain = Game.map.getRoomTerrain(roomName);
        const exits = utils.findExitPos(roomName, FIND_EXIT_TOP).concat(utils.findExitPos(roomName, FIND_EXIT_BOTTOM), utils.findExitPos(roomName, FIND_EXIT_LEFT), utils.findExitPos(roomName, FIND_EXIT_RIGHT));
        const wallMap = new PathFinder.CostMatrix;
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                if (!(terrain.get(i, j) & TERRAIN_MASK_WALL) && !p.isNearExit(i, j, exits)) {
                    wallMap.set(i, j, 255);
                }
            }
        }
        let level = 0;
        let changed = true;
        while (changed == true) {
            changed = false;
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    if (wallMap.get(i, j) == level) {
                        p.spreadWall(i, j, wallMap, level);
                        changed = true;
                    }
                }
            }
            level++;
        }
        const levelNeeded = Math.ceil(Math.max(template.dimensions.x, template.dimensions.y) / 2);
        if (level - 2 < levelNeeded) {
            roomData.s = -1;
            return; //template won't fit
        }
        const candidates = {};
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                if (wallMap.get(i, j) >= levelNeeded) {
                    candidates[i * 50 + j] = {};
                }
            }
        }
        if (Object.keys(candidates).length > 1)
            p.narrowByControllerPos(candidates, roomData, roomName, levelNeeded);
        if (Object.keys(candidates).length > 1)
            p.narrowBySourcePos(candidates, roomData, roomName);
        const center = Object.values(candidates)[0];
        const centerPoint = parseInt(Object.keys(candidates)[0]);
        if (!center.sourceDistance) {
            //TODO sources should be map from src
            const sources = [utils.unpackPos(Object.values(roomData.src)[0], roomName), utils.unpackPos(Object.values(roomData.src)[1], roomName)];
            const realPos = new RoomPosition(Math.floor(centerPoint / 50), centerPoint % 50, roomName);
            center.sourceDistance = PathFinder.search(realPos, { pos: sources[0], range: 1 }, { plainCost: 1, swampCost: 1 }).cost +
                PathFinder.search(realPos, { pos: sources[1], range: 1 }, { plainCost: 1, swampCost: 1 }).cost;
        }
        if (!center.controllerDistance) {
            const controllerPos = utils.unpackPos(roomData.ctrlP, roomName);
            center.controllerDistance = PathFinder.search(new RoomPosition(Math.floor(centerPoint / 50), centerPoint % 50, roomName), { pos: controllerPos, range: 1 }, { plainCost: 1, swampCost: 1 }).cost;
        }
        const controllerScore = center.controllerDistance < levelNeeded + template.wallDistance ? 5 : Math.max(25 - center.controllerDistance, 0);
        const sourceScore = Math.max((70 - center.sourceDistance) / 5, 0);
        const mineralScore = roomData.min == RESOURCE_CATALYST ? 5 : 0;
        roomData.s = controllerScore + sourceScore + mineralScore;
        roomData.c = centerPoint;
    },
    narrowBySourcePos: function (candidates, roomData, roomName) {
        //TODO sources should be map from src
        const sources = [utils.unpackPos(Object.values(roomData.src)[0], roomName), utils.unpackPos(Object.values(roomData.src)[1], roomName)];
        for (const pos of Object.keys(candidates)) {
            const intPos = parseInt(pos);
            const realPos = new RoomPosition(Math.floor(intPos / 50), intPos % 50, roomName);
            candidates[pos].sourceDistance = PathFinder.search(realPos, { pos: sources[0], range: 1 }, { plainCost: 1, swampCost: 1 }).cost +
                PathFinder.search(realPos, { pos: sources[1], range: 1 }, { plainCost: 1, swampCost: 1 }).cost;
        }
        const bestSourceDist = _.min(candidates, "sourceDistance").sourceDistance;
        for (const pos of Object.keys(candidates)) {
            if (candidates[pos].sourceDistance > bestSourceDist)
                delete candidates[pos];
        }
    },
    narrowByControllerPos: function (candidates, roomData, roomName, levelNeeded) {
        const controllerPos = utils.unpackPos(roomData.ctrlP, roomName);
        for (const pos of Object.keys(candidates)) {
            const intPos = parseInt(pos);
            candidates[pos].controllerDistance = PathFinder.search(new RoomPosition(Math.floor(intPos / 50), intPos % 50, roomName), { pos: controllerPos, range: 1 }, { plainCost: 1, swampCost: 1 }).cost;
        }
        const topCandidates = _.filter(candidates, pos => pos.controllerDistance >= levelNeeded + template.wallDistance);
        if (topCandidates.length) {
            for (const pos of Object.keys(candidates)) {
                if (!topCandidates.includes(candidates[pos]))
                    delete candidates[pos];
            }
        }
        const bestControllerDist = _.min(candidates, "controllerDistance").controllerDistance;
        for (const pos of Object.keys(candidates)) {
            if (candidates[pos].controllerDistance > bestControllerDist)
                delete candidates[pos];
        }
    },
    spreadWall: function (x, y, wallMap, level) {
        const maxX = Math.min(x + 1, 49);
        const minX = Math.max(x - 1, 0);
        const maxY = Math.min(y + 1, 49);
        const minY = Math.max(y - 1, 0);
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                if (wallMap.get(i, j) > level) {
                    wallMap.set(i, j, level + 1);
                }
            }
        }
    },
    isNearExit: function (x, y, exits) {
        const distance = 2 + template.wallDistance;
        if ((x > distance && x < 49 - distance) && (y > distance && y < 49 - distance)) {
            return false;
        }
        for (const exit of exits) {
            if (exit.inRangeTo(x, y, distance)) {
                return true;
            }
        }
        return false;
    },
    expand: function () {
        if (Game.cpu.bucket != 10000 || Memory.flags["claim"] || !PServ)
            return;
        const myCities = utils.getMyCities();
        if (Game.gcl.level == myCities.length || Game.gcl.level > myCities.length + 1)
            return;
        const candidates = _.reject(Object.keys(Cache.roomData), roomName => !Cache.roomData[roomName].s
            || Cache.roomData[roomName].s == -1
            || Cache.roomData[roomName].rcl
            || Cache.roomData[roomName].sct < Game.time + CREEP_LIFE_TIME
            || (Cache.roomData[roomName].cB && Cache.roomData[roomName].cB > Game.time)
            || (Cache.roomData[roomName].sMC && Cache.roomData[roomName].sMC > Game.time + CREEP_LIFE_TIME));
        if (!candidates.length)
            return;
        //Log.info("attempting expansion")
        const expoRooms = _.sortBy(candidates, roomName => Cache.roomData[roomName].s).reverse();
        let expoRoomName = null;
        for (const candidate of expoRooms) {
            if (expoRoomName)
                break;
            for (const room of myCities) {
                const controllerPos = utils.unpackPos(Cache.roomData[candidate].ctrlP, candidate);
                const result = PathFinder.search(room.controller.pos, { pos: controllerPos, range: 1 }, {
                    plainCost: 1, swampCost: 1, maxOps: 10000, roomCallback: (roomName) => {
                        if (!Cache.roomData[roomName] || (Cache.roomData[roomName].rcl && CONTROLLER_STRUCTURES[STRUCTURE_TOWER][Cache.roomData[roomName].rcl] && !Memory.settings.allies.includes(Cache.roomData[roomName].own)))
                            return false;
                    }
                });
                if (!result.incomplete && result.path.length < CREEP_CLAIM_LIFE_TIME) {
                    expoRoomName = controllerPos.roomName;
                    break;
                }
            }
        }
        if (!expoRoomName) {
            Log.info("No valid rooms in range for expansion");
            return;
        }
        const expoRoom = Cache.roomData[expoRoomName];
        utils.placeFlag("claim", new RoomPosition(25, 25, expoRoomName));
        utils.placeFlag("plan", new RoomPosition(Math.floor(expoRoom.c / 50) - template.centerOffset.x, expoRoom.c % 50 - template.centerOffset.y, expoRoomName));
    },
    searchForRemote: function (cities) {
        let remote = null;
        Log.info("Searching for new remotes");
        if (!Memory.remotes)
            Memory.remotes = {};
        for (const city of cities) {
            const result = p.findBestRemote(city);
            if (result && (!remote || result.score < remote.score))
                remote = result;
        } //result object will have roomName, score, and homeName
        if (remote) {
            p.addRemote(remote.roomName, remote.homeName);
            Log.info(`Remote ${remote.roomName} added to ${remote.homeName}`);
        }
        else {
            Log.info("No valid remotes found");
        }
    },
    addRemote: function (roomName, homeName) {
        Memory.remotes[roomName] = 1;
        const memory = Memory.spawns[homeName + "0"];
        const roomInfo = Cache.roomData[roomName];
        for (const sourceId in roomInfo.src) {
            //return memory, sourceId
            //uncomment this to activate
            memory.sources[sourceId] = utils.unpackPos(roomInfo.src[sourceId], roomName);
        }
    },
    findBestRemote: function (city) {
        let remote = null;
        const spawn = Game.spawns[city.name + "0"];
        if (!spawn)
            return null;
        const memory = spawn.memory;
        const spawnFreeTime = memory.spawnAvailability;
        if (spawnFreeTime < settings_1.spawnFreeTime)
            return null;
        let distance = 1;
        const roomCoords = utils.roomNameToPos(city.name);
        while (!remote) {
            if (distance > 2)
                break;
            const min = 0 - distance;
            const max = distance + 1;
            for (let i = min; i < max; i++) {
                for (let j = min; j < max; j++) {
                    if (j != min && j != max - 1 && i != min && i != max - 1)
                        continue;
                    const roomPos = [roomCoords[0] + i, roomCoords[1] + j];
                    const roomName = utils.roomPosToName(roomPos);
                    const score = p.scoreRemoteRoom(roomName, spawn);
                    //lower score is better
                    if (score > 0 && (!remote || score < remote.score))
                        remote = { roomName: roomName, homeName: city.name, score: score };
                }
            }
            if (remote)
                break;
            distance++;
        }
        //make sure we can afford this remote in terms of spawn time and that it is profitable
        if (remote) {
            const resourcesNeeded = p.calcSpawnTimeNeeded(remote.roomName, spawn);
            const spawnTimeNeeded = resourcesNeeded.time;
            const profitMargin = resourcesNeeded.profit;
            Log.info(`Remote found at ${remote.roomName} with spawn time of ${spawnTimeNeeded} and profit of ${profitMargin}`);
            if (spawnFreeTime - spawnTimeNeeded < settings_1.spawnFreeTime || profitMargin < 3)
                return null;
        }
        return remote;
    },
    reassessRemote: function (roomName, spawn) {
        const roomInfo = Cache.roomData[roomName];
        if (!roomInfo)
            return -1;
        if (roomInfo.rcl || (roomInfo.sT && roomInfo.sT > Game.time))
            return 100000; //very high number bc this remote should've been dropped anyway
        let totalDistance = 0;
        for (const source in roomInfo.src) {
            const sourcePos = utils.unpackPos(roomInfo.src[source], roomName);
            const result = PathFinder.search(spawn.pos, { pos: sourcePos, range: 1 }, {
                plainCost: 1,
                swampCost: 1,
                maxOps: 20000,
                roomCallback: function (rN) {
                    const safe = Memory.remotes[rN]
                        || (Cache.roomData[rN] && Cache.roomData[rN].own == settings_1.username)
                        || utils.isHighway(rN)
                        || rN == roomName;
                    if (!safe)
                        return false;
                }
            });
            if (result.incomplete)
                return 100000;
            totalDistance += result.cost;
        }
        return totalDistance / Object.keys(roomInfo.src).length;
    },
    scoreRemoteRoom: function (roomName, spawn) {
        const roomInfo = Cache.roomData[roomName];
        if (roomInfo && roomInfo.d >= 4) {
            // if room doesn't have an invader core reduce defcon level
            if (!roomInfo.sME || roomInfo.sME < Game.time) {
                if (Math.random() < 0.5)
                    Cache.roomData[roomName].d = 3;
            }
        }
        if (!roomInfo
            || roomInfo.rcl
            || !roomInfo.src
            || !Object.keys(roomInfo.src).length
            || Memory.remotes[roomName]
            || (spawn.room.energyCapacityAvailable < 2300 && !roomInfo.ctrlP)
            || roomInfo.res && Memory.settings.allies.includes(roomInfo.res) && settings_1.username != roomInfo.res
            || roomInfo.sT && roomInfo.sT > Game.time
            || roomInfo.d >= 4)
            return -1;
        let totalDistance = 0;
        for (const source in roomInfo.src) {
            const sourcePos = utils.unpackPos(roomInfo.src[source], roomName);
            const sourceDistance = utils.getRemoteSourceDistance(spawn.pos, sourcePos);
            if (sourceDistance == -1)
                return -1;
            totalDistance += sourceDistance;
        }
        return totalDistance / Object.keys(roomInfo.src).length;
    },
    dropRemote: function (cities) {
        let remote = null;
        Log.info("CPU too high, dropping least profitable remote...");
        if (!Memory.remotes)
            Memory.remotes = {};
        for (const city of cities) {
            const result = p.findWorstRemote(city);
            if (result && (!remote || result.score > remote.score))
                remote = result;
        } //result object will have roomName, score, and homeName
        if (remote) {
            p.removeRemote(remote.roomName, remote.homeName);
            Log.info(`Remote ${remote.roomName} removed from ${remote.homeName}`);
        }
        else {
            Log.info("No remotes to remove");
        }
    },
    removeRemote: function (roomName, room) {
        delete Memory.remotes[roomName];
        const memory = Memory.spawns[room + "0"];
        for (const sourceId in memory.sources) {
            if (memory.sources[sourceId].roomName == roomName)
                delete memory.sources[sourceId];
        }
    },
    findWorstRemote: function (room) {
        let remote = null;
        const spawn = Game.spawns[room.name + "0"];
        if (!spawn)
            return null;
        const remotes = Object.keys(_.countBy(spawn.memory.sources, s => s.roomName));
        for (const roomName of remotes) {
            if (roomName == room.name)
                continue;
            const score = p.reassessRemote(roomName, spawn);
            if (score > 0 && (!remote || score > remote.score))
                remote = { roomName: roomName, homeName: room.name, score: score };
        }
        return remote;
    },
    calcSpawnTimeNeeded: function (roomName, spawn) {
        //return 3 for invalid (no room can handle 3 spawns worth of spawn time)
        //reserver = 2 body parts every lifetime - distance from controller to spawn
        let totalTime = 0;
        let totalCost = 0; //cost per tick
        const roomInfo = Cache.roomData[roomName];
        if (roomInfo.ctrlP) {
            const controllerPos = utils.unpackPos(roomInfo.ctrlP, roomName);
            const path = PathFinder.search(spawn.pos, { pos: controllerPos, range: 1 }, {
                plainCost: 1,
                swampCost: 1,
                maxOps: 10000
            });
            if (path.incomplete)
                return { profit: 0, time: 3 };
            totalTime += (2 * CREEP_SPAWN_TIME) / (CREEP_CLAIM_LIFE_TIME - path.cost);
            totalCost += types.cost([MOVE, CLAIM]) / (CREEP_CLAIM_LIFE_TIME - path.cost);
        }
        const minerBody = types.getRecipe(remoteMiner.type, spawn.room.energyCapacityAvailable, spawn.room);
        const minerCost = types.cost(minerBody);
        const minerSize = minerBody.length;
        const runnerBody = types.getRecipe(runner_1.type, spawn.room.energyCapacityAvailable, spawn.room);
        const runnerCost = types.cost(runnerBody);
        const runnerSize = runnerBody.length;
        const energyCarried = types.store(runnerBody);
        const harasserBody = types.getRecipe(harasser.type, spawn.room.energyCapacityAvailable, spawn.room);
        const harasserCost = types.cost(harasserBody);
        const harasserSize = harasserBody.length;
        const quadBody = types.getRecipe(quad.type, spawn.room.energyCapacityAvailable, spawn.room);
        const quadCost = types.cost(quadBody) * 4;
        const quadSize = quadBody.length * 4;
        const roadUpkeep = ROAD_DECAY_AMOUNT / ROAD_DECAY_TIME * REPAIR_COST;
        const sourceEnergy = roomInfo.ctrlP ? SOURCE_ENERGY_CAPACITY : SOURCE_ENERGY_KEEPER_CAPACITY;
        const sKGuardBody = types.getRecipe(sKguard.type, spawn.room.energyCapacityAvailable, spawn.room);
        const sKGuardCost = types.cost(sKGuardBody);
        const sKGuardSize = sKGuardBody.length;
        totalTime += harasserSize * CREEP_SPAWN_TIME / CREEP_LIFE_TIME;
        totalCost += harasserCost / CREEP_LIFE_TIME;
        if (utils.isSKRoom(roomName)) {
            if (spawn.room.controller.level < 7) {
                totalTime += quadSize * CREEP_SPAWN_TIME / (CREEP_LIFE_TIME - quadSize); //subtracting quad size to account for prespawn
                totalCost += quadCost / (CREEP_LIFE_TIME - quadSize);
            }
            else {
                // increase time by sKGuard spawn time factoring in 300 ticks of buffer to get to the room
                totalTime += sKGuardSize * CREEP_SPAWN_TIME / (CREEP_LIFE_TIME - sKGuardSize - 300);
                totalCost += sKGuardCost / (CREEP_LIFE_TIME - 300);
            }
        }
        for (const source in roomInfo.src) {
            const sourcePos = utils.unpackPos(roomInfo.src[source], roomName);
            const result = PathFinder.search(spawn.pos, { pos: sourcePos, range: 1 }, {
                plainCost: 1,
                swampCost: 1,
                maxOps: 10000
            });
            if (result.incomplete)
                return { profit: 0, time: 3 };
            const energyProduced = 2 * result.cost * sourceEnergy / ENERGY_REGEN_TIME;
            const runnersNeeded = energyProduced / energyCarried;
            totalTime += ((minerSize * CREEP_SPAWN_TIME) / (CREEP_LIFE_TIME - result.cost)) + (runnersNeeded * runnerSize * CREEP_SPAWN_TIME / CREEP_LIFE_TIME);
            totalCost += (minerCost / (CREEP_LIFE_TIME - result.cost)) + (roadUpkeep * result.cost) + (runnersNeeded * runnerCost / CREEP_LIFE_TIME);
        }
        const revenue = sourceEnergy * Object.keys(roomInfo.src).length / ENERGY_REGEN_TIME;
        const profit = revenue - totalCost;
        if (!roomInfo.ctrlP) {
            Log.info(`Room ${roomName} has a profit of ${profit} and a spawn time of ${totalTime} ticks`);
        }
        return { profit: profit, time: totalTime };
    },
    findRooms: function () {
        if (!p.newRoomNeeded()) {
            return;
        }
        const rooms = utils.getAllRoomsInRange(10, p.roomsSelected());
        const validRooms = p.getValidRooms(rooms);
        const rankings = p.sortByScore(validRooms);
        if (rankings.length) {
            p.addRoom(rankings[0]);
        }
        return;
    },
    planRooms: function () {
        // TODO
        // 1. for rooms I own. If room has a spawn or a plan, ignore. otherwise plan.
        // 2. if bucket is less than 3k, return
        // 
    },
    buildConstructionSites: function () {
        const noobMode = Object.keys(Game.rooms).length < 5 || Game.gcl.level < 2; // We've seen less than 5 rooms
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my) {
                continue;
            }
            if (!room.memory.plan && Game.spawns[roomName + "0"]) {
                const spawnPos = Game.spawns[roomName + "0"].pos;
                room.memory.plan = {};
                room.memory.plan.x = spawnPos.x + template.offset.x - template.buildings.spawn.pos[0].x;
                room.memory.plan.y = spawnPos.y + template.offset.y - template.buildings.spawn.pos[0].y;
            }
            const planFlag = Memory.flags.plan;
            if (planFlag && planFlag.roomName == roomName && room.controller.owner && room.controller.owner.username == "Yoner") {
                room.memory.plan = {};
                room.memory.plan.x = planFlag.x;
                room.memory.plan.y = planFlag.y;
                delete Memory.flags.plan;
                p.clearAllStructures(room);
            }
            if (room.memory.plan) {
                const plan = room.memory.plan;
                let spawnCount = 0;
                _.forEach(template.buildings, function (locations, structureType) {
                    locations.pos.forEach(location => {
                        const pos = { "x": plan.x + location.x - template.offset.x,
                            "y": plan.y + location.y - template.offset.y };
                        const name = roomName + spawnCount;
                        spawnCount = structureType == STRUCTURE_SPAWN ? spawnCount + 1 : spawnCount;
                        if (Game.cpu.getUsed() + 20 > Game.cpu.tickLimit) {
                            return;
                        }
                        if (!noobMode || room.energyCapacityAvailable >= 800 || structureType != STRUCTURE_ROAD) {
                            p.buildConstructionSite(room, structureType, pos, name);
                        }
                    });
                });
                if (room.controller.level >= 2)
                    p.buildControllerLink(room, room.controller.level);
                if (!noobMode || room.energyCapacityAvailable >= 800) { //rcl3 with extensions done
                    p.buildRoads(room, plan);
                }
                if (room.controller.level >= 4 && room.storage) {
                    p.buildWalls(room, plan);
                }
                if (room.controller.level >= 6) {
                    p.buildExtractor(room);
                    p.buildSourceLinks(room);
                }
            }
        }
    },
    buildConstructionSite: function (room, structureType, pos, name) {
        if (!room)
            return;
        const roomInfo = utils.getsetd(Cache.roomData, room.name, {});
        if (Game.time != roomInfo.pTick) {
            roomInfo.pTick = Game.time;
            roomInfo.cSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
        }
        if (roomInfo.cSites > 3)
            return;
        if ([STRUCTURE_FACTORY, STRUCTURE_POWER_SPAWN, STRUCTURE_NUKER].includes(structureType) && PServ)
            return;
        if (structureType == STRUCTURE_LAB) {
            if (room.controller.level < 7 && Game.gcl.level < 4)
                return;
            if (!room.storage || room.storage.store[RESOURCE_ENERGY] < 160000)
                return;
        }
        if (structureType == STRUCTURE_TOWER && room.controller.safeMode > 5000)
            return;
        const look = room.lookAt(pos.x, pos.y);
        if (structureType == STRUCTURE_TERMINAL && room.controller.level < 5 && room.controller.level > 1 && !room.storage) {
            structureType = STRUCTURE_CONTAINER;
        }
        else if (structureType == STRUCTURE_TERMINAL) {
            const containerObj = _.find(look, object => object.type == LOOK_STRUCTURES && object[LOOK_STRUCTURES].structureType == STRUCTURE_CONTAINER);
            if (containerObj) {
                containerObj[LOOK_STRUCTURES].destroy();
            }
        }
        const terrain = _.find(look, item => item.type == LOOK_TERRAIN);
        if (terrain && (terrain[LOOK_TERRAIN] == "wall" && structureType == STRUCTURE_ROAD) || _.find(look, item => item.type == LOOK_STRUCTURES && item[LOOK_STRUCTURES].structureType == structureType))
            return;
        if (room.createConstructionSite(pos.x, pos.y, structureType, name) == 0)
            roomInfo.cSites++;
    },
    buildExtractor: function (room) {
        const minerals = room.find(FIND_MINERALS);
        if (minerals.length) {
            const mineralPos = minerals[0].pos;
            if (!mineralPos.lookFor(LOOK_STRUCTURES).length) {
                p.buildConstructionSite(room, STRUCTURE_EXTRACTOR, mineralPos);
            }
        }
    },
    buildWalls: function (room, plan) {
        //first identify all locations to be walled, if there is a road there,
        //place a rampart instead. if there is a terrain wall don't make anything
        const startX = plan.x - template.wallDistance;
        const startY = plan.y - template.wallDistance;
        const wallSpots = [];
        for (let i = startX; i < startX + template.dimensions.x + (template.wallDistance * 2); i++) {
            if (i > 0 && i < 49) {
                if (startY > 0 && startY < 49) {
                    wallSpots.push(new RoomPosition(i, startY, room.name));
                }
                if (startY + template.dimensions.y + (template.wallDistance * 2) - 1 > 0 && startY + template.dimensions.y + (template.wallDistance * 2) - 1 < 49) {
                    wallSpots.push(new RoomPosition(i, startY + template.dimensions.y + (template.wallDistance * 2) - 1, room.name));
                }
            }
        }
        for (let i = startY; i < startY + template.dimensions.y + (template.wallDistance * 2); i++) {
            if (i > 0 && i < 49) {
                if (startX > 0 && startX < 49) {
                    wallSpots.push(new RoomPosition(startX, i, room.name));
                }
                if (startX + template.dimensions.x + (template.wallDistance * 2) - 1 > 0 && startX + template.dimensions.x + (template.wallDistance * 2) - 1 < 49) {
                    wallSpots.push(new RoomPosition(startX + template.dimensions.x + (template.wallDistance * 2) - 1, i, room.name));
                }
            }
        }
        const terrain = new Room.Terrain(room.name);
        const costs = new PathFinder.CostMatrix();
        _.forEach(wallSpots, function (wallSpot) {
            costs.set(wallSpot.x, wallSpot.y, 0xff);
        });
        room.wallCosts = costs;
        for (let i = 0; i < wallSpots.length; i++) { //build stuff
            if (terrain.get(wallSpots[i].x, wallSpots[i].y) === TERRAIN_MASK_WALL) {
                continue;
            }
            const structures = room.lookForAt(LOOK_STRUCTURES, wallSpots[i]);
            let wall = false;
            for (let j = 0; j < structures.length; j++) {
                if (structures[j].structureType === STRUCTURE_WALL || structures[j].structureType === STRUCTURE_RAMPART) {
                    wall = true;
                    break;
                }
            }
            if (wall) {
                continue;
            }
            //if we make it here, no wall or rampart has been placed on this spot
            //first we will check to see if we even need a barrier
            //then, if we do need one, it'll be a ramp if structures.length, else it'll be a wall
            //check by attempting to path to all exits
            let wallNeeded = false;
            const roomExits = Object.keys(Game.map.describeExits(room.name));
            const origin = new RoomPosition(wallSpots[i].x, wallSpots[i].y, room.name);
            const searchSettings = {
                plainCost: 1,
                swampCost: 1,
                maxOps: 1000,
                maxRooms: 1,
                roomCallback: function (roomName) {
                    return Game.rooms[roomName].wallCosts;
                }
            };
            for (const exitDirection of roomExits) {
                const exits = room.find(parseInt(exitDirection));
                const path = PathFinder.search(origin, exits, searchSettings);
                //if path is complete, we need a wall
                if (!path.incomplete) {
                    wallNeeded = true;
                    break;
                }
            }
            const interiorPos = new RoomPosition(plan.x, plan.y, room.name);
            const spawnPath = PathFinder.search(origin, { pos: interiorPos, range: 1 }, searchSettings);
            if (!wallNeeded || spawnPath.incomplete) {
                continue;
            }
            //now we need a wall
            if (structures.length || wallSpots[i].getRangeTo(room.controller) == 3) { //rampart
                p.buildConstructionSite(room, STRUCTURE_RAMPART, wallSpots[i]);
                room.visual.circle(wallSpots[i], { fill: "transparent", radius: 0.25, stroke: "green" });
            }
            else { //wall
                p.buildConstructionSite(room, STRUCTURE_WALL, wallSpots[i]);
                room.visual.circle(wallSpots[i], { fill: "transparent", radius: 0.25, stroke: "blue" });
            }
        }
    },
    buildControllerLink: function (room, rcl) {
        const spawn = Game.spawns[room.name + "0"];
        if (!spawn)
            return;
        if (spawn.memory.upgradeLinkPos) {
            const pos = spawn.memory.upgradeLinkPos;
            if (rcl < 5) {
                p.buildConstructionSite(room, STRUCTURE_CONTAINER, new RoomPosition(Math.floor(pos / 50), pos % 50, room.name));
            }
            else {
                const look = room.lookAt(Math.floor(pos / 50), pos % 50);
                for (const item of look) {
                    if (item.type == LOOK_STRUCTURES && item[LOOK_STRUCTURES].structureType == STRUCTURE_CONTAINER)
                        item[LOOK_STRUCTURES].destroy();
                }
                p.buildConstructionSite(room, STRUCTURE_LINK, new RoomPosition(Math.floor(pos / 50), pos % 50, room.name));
            }
            return;
        }
        const creeps = room.controller.pos.findInRange(FIND_MY_CREEPS, 3);
        const upgrader$1 = _.find(creeps, c => c.memory.role == upgrader.name);
        if (!upgrader$1)
            return;
        let location = null;
        let bestScore = 0;
        for (let i = upgrader$1.pos.x - 1; i <= upgrader$1.pos.x + 1; i++) {
            for (let j = upgrader$1.pos.y - 1; j <= upgrader$1.pos.y + 1; j++) {
                const look = room.lookAt(i, j);
                let isValidPos = true;
                for (const item of look) {
                    if (item.type == LOOK_STRUCTURES
                        || (item.type == LOOK_TERRAIN && item[LOOK_TERRAIN] == "wall"))
                        isValidPos = false;
                }
                if (isValidPos) {
                    //score by empty positions in range of controller
                    let currentScore = 0;
                    for (let k = i - 1; k <= i + 1; k++) {
                        for (let l = j - 1; l <= j + 1; l++) {
                            const look2 = room.lookAt(k, l);
                            for (const item of look2) {
                                if (!((item.type == LOOK_STRUCTURES && item[LOOK_STRUCTURES].structureType != STRUCTURE_ROAD && item[LOOK_STRUCTURES].structureType != STRUCTURE_RAMPART)
                                    || (item.type == LOOK_TERRAIN && item[LOOK_TERRAIN] == "wall")) && room.controller.pos.inRangeTo(k, l, 3))
                                    currentScore++;
                            }
                        }
                    }
                    if (currentScore > bestScore) {
                        location = i * 50 + j;
                        bestScore = currentScore;
                    }
                }
            }
        }
        if (location) {
            spawn.memory.upgradeLinkPos = location;
            p.buildConstructionSite(room, STRUCTURE_LINK, new RoomPosition(Math.floor(location / 50), location % 50, room.name));
        }
        else {
            Log.info(`No link placement for controller in ${room.name}`);
        }
    },
    buildSourceLinks: function (room) {
        const sources = room.find(FIND_SOURCES);
        const spawn = Game.spawns[room.name + "0"];
        if (!spawn)
            return;
        for (const source of sources) {
            if (spawn.memory.sources[source.id] && spawn.memory.sources[source.id][STRUCTURE_LINK + "Pos"]) {
                const pos = spawn.memory.sources[source.id][STRUCTURE_LINK + "Pos"];
                p.buildConstructionSite(room, STRUCTURE_LINK, new RoomPosition(Math.floor(pos / 50), pos % 50, room.name));
                continue;
            }
            const creeps = source.pos.findInRange(FIND_MY_CREEPS, 1);
            const miner = _.find(creeps, c => c.memory.source = source.id);
            if (!miner)
                continue;
            let location = null;
            for (let i = miner.pos.x - 1; i <= miner.pos.x + 1; i++) {
                if (location)
                    break;
                for (let j = miner.pos.y - 1; j <= miner.pos.y + 1; j++) {
                    if (miner.pos.isEqualTo(i, j) || i <= 2 || j <= 2)
                        continue;
                    const look = room.lookAt(i, j);
                    let go = true;
                    for (const item of look) {
                        if (item.type == LOOK_STRUCTURES
                            || (item.type == LOOK_CREEPS && item[LOOK_CREEPS].memory.role == remoteMiner.name)
                            || (item.type == LOOK_TERRAIN && item[LOOK_TERRAIN] == "wall"))
                            go = false;
                    }
                    if (go) {
                        location = i * 50 + j;
                        break;
                    }
                }
            }
            if (location) {
                if (!spawn.memory.sources[source.id]) {
                    Log.error(`Source not in memory at ${source.pos}`);
                    return;
                }
                spawn.memory.sources[source.id][STRUCTURE_LINK + "Pos"] = location;
                p.buildConstructionSite(room, STRUCTURE_LINK, new RoomPosition(Math.floor(location / 50), location % 50, room.name));
            }
            else {
                Log.info(`No link placement for source at ${source.pos}`);
            }
        }
    },
    makeRoadMatrix: function (room, plan) {
        const costs = new PathFinder.CostMatrix();
        if (plan) {
            _.forEach(template.buildings, function (locations, structureType) {
                locations.pos.forEach(location => {
                    const pos = { "x": plan.x + location.x - template.offset.x,
                        "y": plan.y + location.y - template.offset.y };
                    if (structureType !== STRUCTURE_ROAD) {
                        costs.set(pos.x, pos.y, 0xff);
                    }
                });
            });
        }
        room.find(FIND_STRUCTURES).forEach(function (struct) {
            if (struct.structureType === STRUCTURE_ROAD) {
                // Favor roads over plain tiles
                costs.set(struct.pos.x, struct.pos.y, 1);
            }
            else if (struct.structureType !== STRUCTURE_CONTAINER &&
                (struct.structureType !== STRUCTURE_WALL) && //allow roads on walls so that path to controller still works
                (struct.structureType !== STRUCTURE_RAMPART)) {
                // Can't walk through non-walkable buildings
                costs.set(struct.pos.x, struct.pos.y, 0xff);
            }
            else if (!struct.my) { //allow roads on walls so that path to controller still works
                costs.set(struct.pos.x, struct.pos.y, 5);
            }
        });
        room.find(FIND_MY_CONSTRUCTION_SITES).forEach(function (site) {
            if (site.structureType === STRUCTURE_ROAD) {
                // Favor roads over plain tiles
                costs.set(site.pos.x, site.pos.y, 1);
            }
        });
        return costs;
    },
    getSourcePaths: function (room, exits, roadMatrix) {
        const sources = Object.keys(Game.spawns[room.memory.city].memory.sources).reverse();
        const sourcePaths = [];
        for (let i = 0; i < sources.length; i++) {
            const source = Game.getObjectById(sources[i]);
            if (!source)
                continue;
            const sourcePos = source.pos;
            const sourcePath = PathFinder.search(sourcePos, exits, {
                plainCost: 4, swampCost: 5, maxRooms: 5,
                roomCallback: function (roomName) {
                    if (roomName == room.name)
                        return roadMatrix;
                    if (Game.rooms[roomName]) {
                        return p.makeRoadMatrix(Game.rooms[roomName], Game.rooms[roomName].memory.plan);
                    }
                }
            });
            for (let j = 0; j < sourcePath.path.length; j++) {
                sourcePaths.push(sourcePath.path[j]);
            }
        }
        return sourcePaths.reverse();
    },
    getMineralPath: function (room, exits, roadMatrix) {
        const mineralPos = room.find(FIND_MINERALS)[0].pos;
        const mineralPath = PathFinder.search(mineralPos, exits, {
            plainCost: 4, swampCost: 4, maxRooms: 1,
            roomCallback: () => roadMatrix
        });
        return mineralPath.path.reverse();
    },
    getControllerPath: function (room, exits, roadMatrix) {
        const path = [];
        const structures = room.find(FIND_MY_STRUCTURES);
        const controller = _.find(structures, structure => structure.structureType === STRUCTURE_CONTROLLER);
        const controllerPos = controller.pos;
        const controllerPath = PathFinder.search(controllerPos, exits, {
            plainCost: 4, swampCost: 4, maxRooms: 1,
            roomCallback: () => roadMatrix
        });
        for (let i = 2; i < controllerPath.path.length; i++) { // don't include first two paths (not needed)
            path.push(controllerPath.path[i]);
        }
        return path.reverse();
    },
    getExitPaths: function (room, exits, plan, roadMatrix) {
        const roomExits = Object.keys(Game.map.describeExits(room.name));
        const path = [];
        const startPoint = template.buildings.storage.pos[0];
        const startPos = new RoomPosition(plan.x + startPoint.x - template.offset.x, plan.y + startPoint.y - template.offset.y, room.name);
        for (const exitDirection of roomExits) {
            const exitSpots = room.find(parseInt(exitDirection));
            const exitPath0 = PathFinder.search(startPos, exitSpots, {
                plainCost: 4, swampCost: 4, maxRooms: 1,
                roomCallback: () => roadMatrix
            });
            const exitPoint = exitPath0.path[exitPath0.path.length - 1];
            //now path from this point to template exits
            const exitPath = PathFinder.search(exitPoint, exits, {
                plainCost: 4, swampCost: 4, maxRooms: 1,
                roomCallback: () => roadMatrix
            });
            const exitPathPath = exitPath.path;
            exitPathPath.reverse();
            const safeZoneDimensions = {
                "x": [plan.x - template.wallDistance, plan.x + template.dimensions.x + template.wallDistance - 1],
                "y": [plan.y - template.wallDistance, plan.y + template.dimensions.y + template.wallDistance - 1]
            };
            for (const pathPoint of exitPathPath) {
                if (pathPoint.x < safeZoneDimensions.x[0]
                    || pathPoint.x > safeZoneDimensions.x[1]
                    || pathPoint.y < safeZoneDimensions.y[0]
                    || pathPoint.y > safeZoneDimensions.y[1]) {
                    break;
                }
                path.push(pathPoint);
            }
        }
        return path;
    },
    compileRoads: function (a, b, c, d) {
        return a.concat(b, c, d);
    },
    buildRoads: function (room, plan) {
        //need roads to sources, mineral, controller (3 spaces away), exits (nearest exit point for each)
        if (!(room.memory.city && Game.spawns[room.memory.city] && Game.spawns[room.memory.city].memory.sources)) {
            return;
        }
        const exits = [];
        for (let i = 0; i < template.exits.length; i++) {
            const posX = plan.x + template.exits[i].x - template.offset.x;
            const posY = plan.y + template.exits[i].y - template.offset.y;
            const roomPos = new RoomPosition(posX, posY, room.name);
            exits.push(roomPos);
        } //exits now filled with roomPos of all exits from template
        //generateCM
        const roadMatrix = p.makeRoadMatrix(room, plan);
        //roads from sources
        const sourcePaths = p.getSourcePaths(room, exits, roadMatrix);
        //road from mineral
        const mineralPath = p.getMineralPath(room, exits, roadMatrix);
        //road from controller
        const controllerPath = p.getControllerPath(room, exits, roadMatrix);
        //roads from exits
        const exitPaths = p.getExitPaths(room, exits, plan, roadMatrix);
        //push all paths onto big list
        const roads = p.compileRoads(controllerPath, sourcePaths, mineralPath, exitPaths);
        //place Csites
        for (let i = 0; i < roads.length; i++) {
            new RoomVisual(roads[i].roomName).circle(roads[i], { fill: "#ff1111", radius: 0.1, stroke: "red" });
            p.buildConstructionSite(Game.rooms[roads[i].roomName], STRUCTURE_ROAD, roads[i]);
        }
    },
    clearAllStructures: function (room) {
        const structures = room.find(FIND_STRUCTURES);
        _.forEach(structures, structure => {
            if (!structure.my) {
                structure.destroy();
            }
        });
    },
    planRoom: function (roomName) {
        const ter = Game.map.getRoomTerrain(roomName);
        const sqd = _(Array(50)).map((r, i) => {
            return _(Array(50))
                .map((v, j) => ter.get(i, j) == TERRAIN_MASK_WALL ? 0 : Infinity)
                .value();
        }).value();
        const b = 4; // buffer
        const r = 50; // room size
        const min = b;
        const max = r - b - 1;
        for (let i = min; i <= max; i++) {
            for (let j = min; j <= max; j++) {
                sqd[i][j] = Math.min(sqd[i][j], sqd[i - 1][j] + 1, sqd[i - 1][j - 1] + 1);
            }
        }
        for (let i = max; i >= min; i--) {
            for (let j = min; j <= max; j++) {
                sqd[i][j] = Math.min(sqd[i][j], sqd[i][j - 1] + 1, sqd[i + 1][j - 1] + 1);
            }
        }
        for (let i = max; i >= min; i--) {
            for (let j = max; j >= min; j--) {
                sqd[i][j] = Math.min(sqd[i][j], sqd[i + 1][j] + 1, sqd[i + 1][j + 1] + 1);
            }
        }
        for (let i = min; i <= max; i++) {
            for (let j = max; j >= min; j--) {
                sqd[i][j] = Math.min(sqd[i][j], sqd[i][j + 1] + 1, sqd[i - 1][j + 1] + 1);
            }
        }
        return _(sqd).find(row => _(row).find(score => score >= 7));
    },
    newRoomNeeded: function () {
        return (Game.time % p.frequency === 0) &&
            (Game.gcl.level > p.roomsSelected.length) &&
            p.hasCpu() &&
            p.totalEnergy() > 200000 &&
            p.isRcl4() &&
            p.myRooms().length === p.roomsSelected().length;
    },
    getValidRooms: function (rooms) {
        return _.filter(rooms, p.isValidRoom);
    },
    isValidRoom: function (roomName) {
        if (!Game.map.isRoomAvailable(roomName))
            return false;
        return false;
    },
    sortByScore: function (rooms) {
        return rooms; // TODO
    },
    addRoom: function (room) {
        const selected = p.roomsSelected();
        selected.push(room.name);
    },
    roomsSelected: function () {
        let selected = Memory.roomsSelected;
        if (!selected) {
            selected = p.myRoomNames();
            Memory.roomsSelected = selected;
        }
        return selected;
    },
    isRcl4: function () {
        const rooms = p.myRooms();
        const rcls = _.map(rooms, (room) => room.controller.level);
        return _.max(rcls) >= 4;
    },
    totalEnergy: function () {
        const rooms = p.myRooms();
        const energy = _.map(rooms, p.getStorageEnergy);
        return _.sum(energy);
    },
    getStorageEnergy: function (room) {
        return room.storage ? room.storage.store.energy : 0;
    },
    myRooms: function () {
        return _.filter(Game.rooms, (room) => utils.iOwn(room.name));
    },
    myRoomNames: function () {
        return _.map(p.myRooms(), (room) => room.name);
    },
    hasCpu: function () {
        const used = Memory.stats["cpu.getUsed"];
        return (used !== undefined) && (used < Game.cpu.tickLimit / 2);
    }
};
var roomplan = p;

function makeCreeps(role, city, unhealthyStore = false, creepWantsBoosts = false, flag = null, budget = null) {
    const room = Game.spawns[city].room;
    if (Memory.flags.claim && Memory.flags.claim.roomName == room.name)
        return true;
    const energyToSpend = budget ||
        (unhealthyStore ? room.energyAvailable : room.energyCapacityAvailable);
    const weHaveBoosts = utils.boostsAvailable(role, room);
    const boosted = creepWantsBoosts && weHaveBoosts;
    const recipe = types.getRecipe(role.type, energyToSpend, room, boosted, flag);
    const spawns = room.find(FIND_MY_SPAWNS);
    if (!Memory.counter) {
        Memory.counter = 0;
    }
    const name = creepUtils.generateCreepName(Memory.counter.toString(), role.name);
    if (types.cost(recipe) > room.energyAvailable)
        return false;
    const spawn = roomUtils.getAvailableSpawn(spawns);
    if (!spawn)
        return false;
    Memory.counter++;
    const result = spawn.spawnCreep(recipe, name);
    if (result) { // don't spawn and throw an error at the end of the tick
        error_1.reportError(new Error(`Error making ${role.name} in ${city}: ${result}`));
        return false;
    }
    if (boosted) {
        roomUtils.requestBoosterFill(Game.spawns[city], role.boosts);
    }
    Game.creeps[name].memory.role = role.name;
    Game.creeps[name].memory.mode = role.target;
    Game.creeps[name].memory.target = role.target;
    Game.creeps[name].memory.city = city;
    Game.creeps[name].memory.needBoost = boosted;
    Game.creeps[name].memory.flag = flag;
    return true;
}
//runCity function
function runCity(city, creeps) {
    const spawn = Game.spawns[city];
    if (!spawn)
        return false;
    const room = spawn.room;
    updateSpawnStress(spawn);
    // Only build required roles during financial stress
    const emergencyRoles = roles.getEmergencyRoles();
    const allRoles = roles.getRoles();
    const storage = roomUtils.getStorage(room);
    const halfCapacity = storage && storage.store.getCapacity() / 2;
    const unhealthyStore = storage && storage.store[RESOURCE_ENERGY] < Math.min(5000, halfCapacity);
    const roles$1 = (unhealthyStore) ? emergencyRoles : allRoles;
    // Get counts for roles by looking at all living and queued creeps
    const nameToRole = _.groupBy(allRoles, role => role.name); // map from names to roles
    const counts = _.countBy(creeps, creep => creep.memory.role); // lookup table from role to count
    const queuedCounts = spawnQueue.getCounts(spawn);
    _.forEach(roles$1, role => {
        const liveCount = counts[role.name] || 0;
        const queueCount = queuedCounts[role.name] || 0;
        counts[role.name] = liveCount + queueCount;
    });
    if (Game.time % 50 == 0) {
        spawnQueue.sort(spawn);
    }
    let usedQueue = true;
    const nextRoleInfo = spawnQueue.peekNextRole(spawn) || {};
    const spawnQueueRoleName = nextRoleInfo.role;
    let nextRole = spawnQueueRoleName ? nameToRole[spawnQueueRoleName][0] : undefined;
    if (!nextRole) {
        nextRole = _.find(roles$1, role => (typeof counts[role.name] == "undefined" &&
            spawn.memory[role.name]) || (counts[role.name] < spawn.memory[role.name]));
        usedQueue = false;
    }
    if (nextRole) {
        if (makeCreeps(nextRole, city, unhealthyStore, nextRoleInfo.boosted, nextRoleInfo.flag, nextRoleInfo.budget) && usedQueue) {
            spawnQueue.removeNextRole(spawn);
        }
    }
    // Run all the creeps in this city
    _.forEach(creeps, (creep) => {
        nameToRole[creep.memory.role][0].run(creep);
    });
    link.run(room);
    runPowerSpawn(city);
    labs_1.run(city);
    factory.runFactory(city);
    checkNukes(room);
    updateRemotes(city);
}
//updateCountsCity function
function updateCountsCity(city, creeps, rooms, claimRoom, unclaimRoom) {
    const spawn = Game.spawns[city];
    if (!spawn)
        return false;
    const memory = spawn.memory;
    const controller = spawn.room.controller;
    const rcl = controller.level;
    const rcl8 = rcl > 7;
    const emergencyTime = spawn.room.storage && spawn.room.storage.store.energy < 5000 && rcl > 4 ||
        (rcl > 6 && !spawn.room.storage);
    const logisticsTime = rcl8 && !emergencyTime ? 500 : 50;
    // Always update defender
    updateDefender(spawn, rcl, creeps);
    updateQR(spawn, creeps);
    if (Game.time % 200 == 0) {
        updateMilitary(city, memory, rooms, spawn, creeps);
    }
    if (Game.time % logisticsTime == 0 || Game.time < 10) {
        const structures = spawn.room.find(FIND_STRUCTURES);
        const extensions = _.filter(structures, structure => structure.structureType == STRUCTURE_EXTENSION).length;
        updateRunner(creeps, spawn, extensions, memory, rcl, emergencyTime);
        updateFerry(spawn, memory, rcl);
        updateMiner(creeps, rcl8, memory, spawn);
        updateBuilder(rcl, memory, spawn, creeps);
        updateRepairer(spawn, memory, creeps);
        updateUpgrader(city, controller, memory, rcl8, creeps, rcl);
        updateTransporter(extensions, memory, creeps, structures, spawn);
        if (Game.time % 500 === 0) {
            runNuker(city);
            checkLabs(city);
            updateColonizers(city, memory, claimRoom, unclaimRoom);
            updateMineralMiner(rcl, structures, spawn, creeps);
            updatePowerSpawn(city, memory);
            updateStorageLink(spawn, memory, structures);
        }
        makeEmergencyCreeps(extensions, creeps, city, rcl8, emergencyTime);
    }
}
function checkNukes(room) {
    if (Game.time % 1000 === 3) {
        const nukes = room.find(FIND_NUKES);
        if (nukes.length) {
            Game.notify("Nuclear launch detected in " + room.name, 720);
            Log.warning(`Nuclear launch detected in ${room.name}`);
        }
    }
}
function makeEmergencyCreeps(extensions, creeps, city, rcl8, emergency) {
    const checkTime = rcl8 ? 200 : 50;
    const memory = Game.spawns[city].memory;
    if (emergency || Game.time % checkTime == 0 && extensions >= 1) {
        if (_.filter(creeps, creep => creep.memory.role == remoteMiner.name).length < 1 && memory[remoteMiner.name] > 0) {
            Log.info(`Making Emergency Miner in ${city}`);
            makeCreeps(remoteMiner, city, true);
        }
        if (_.filter(creeps, creep => creep.memory.role == transporter.name).length < 1) {
            Log.info(`Making Emergency Transporter in ${city}`);
            makeCreeps(transporter, city, true);
        }
        // TODO disable if links are present (not rcl8!! links may be missing for rcl8)
        if ((emergency || !rcl8) && _.filter(creeps, creep => creep.memory.role == runner_1.name).length < 1 && memory[runner_1.name] > 0) {
            Log.info(`Making Emergency Runner in ${city}`);
            makeCreeps(runner_1, city, true);
        }
    }
}
function updateQR(spawn, creeps) {
    if (Game.time % 100 == 5) {
        const flag = spawn.name + "qrCode";
        if (Memory.flags[flag]) {
            const creepsNeeded = _.sum(template.qrCoords, elem => elem.length);
            creepUtils.scheduleIfNeeded(qrCode.name, creepsNeeded, false, spawn, creeps, flag);
        }
    }
}
// Run the tower function
function runTowers(city) {
    const spawn = Game.spawns[city];
    if (spawn) {
        if (spawn.memory.towersActive == undefined) {
            spawn.memory.towersActive = false;
        }
        const checkTime = 20;
        if (spawn.memory.towersActive == false && Game.time % checkTime != 0) {
            return;
        }
        const towers = _.filter(spawn.room.find(FIND_MY_STRUCTURES), (structure) => structure.structureType == STRUCTURE_TOWER);
        const injuredCreep = spawn.room.find(FIND_MY_CREEPS, { filter: (injured) => {
                return (injured) && injured.hits < injured.hitsMax;
            } });
        const injuredPower = spawn.room.find(FIND_MY_POWER_CREEPS, { filter: (injured) => {
                return (injured) && injured.hits < injured.hitsMax;
            } });
        const hostiles = utils.findHostileCreeps(spawn.room);
        const injured = injuredPower.concat(injuredCreep);
        let damaged = null;
        let repair = 0;
        let target = null;
        maybeSafeMode(city, hostiles);
        if (Game.time % checkTime === 0) {
            const needRepair = _.filter(spawn.room.find(FIND_STRUCTURES), s => s.structureType != STRUCTURE_WALL
                && s.structureType != STRUCTURE_RAMPART
                && s.structureType != STRUCTURE_CONTAINER
                && s.hitsMax - s.hits > TOWER_POWER_REPAIR); //structure must need at least as many hits missing as a minimum tower shot
            if (needRepair.length) {
                damaged = _.min(needRepair, function (s) {
                    return s.hits / s.hitsMax;
                });
            }
            if (damaged) {
                repair = damaged.hitsMax - damaged.hits;
            }
        }
        const lowEnergy = spawn.room.storage && spawn.room.terminal && spawn.room.storage.store.energy < 40000;
        if (hostiles.length > 0 && !lowEnergy) {
            spawn.memory.towersActive = true;
            //identify target 
            target = tower_1.chooseTarget(towers, hostiles, spawn.pos.roomName);
        }
        else {
            spawn.memory.towersActive = false;
        }
        for (let i = 0; i < towers.length; i++) {
            if (target) {
                towers[i].attack(target);
            }
            else if (injured.length > 0 && !hostiles.length) {
                towers[i].heal(injured[0]);
            }
            else if (Game.time % checkTime === 0 && damaged) {
                if (repair < TOWER_POWER_REPAIR * (1 - TOWER_FALLOFF)) {
                    continue;
                }
                const distance = towers[i].pos.getRangeTo(damaged.pos);
                const damage_distance = Math.max(TOWER_OPTIMAL_RANGE, Math.min(distance, TOWER_FALLOFF_RANGE));
                const steps = TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE;
                const step_size = TOWER_FALLOFF * TOWER_POWER_REPAIR / steps;
                const repStrength = TOWER_POWER_REPAIR - (damage_distance - TOWER_OPTIMAL_RANGE) * step_size;
                if (repStrength <= repair) {
                    towers[i].repair(damaged);
                    repair -= repStrength;
                }
            }
        }
    }
}
function maybeSafeMode(city, hostiles) {
    const room = Game.spawns[city].room;
    const plan = Memory.rooms[room.name].plan;
    if (!plan)
        return;
    const minX = plan.x - template.wallDistance;
    const minY = plan.y - template.wallDistance;
    const maxX = plan.x + template.dimensions.x + template.wallDistance - 1;
    const maxY = plan.y + template.dimensions.y + template.wallDistance - 1;
    if (_.find(hostiles, h => h.pos.x > minX
        && h.pos.x < maxX
        && h.pos.y > minY
        && h.pos.y < maxY)
        && room.controller.safeModeAvailable
        && !room.controller.safeModeCooldown) {
        room.controller.activateSafeMode();
    }
}
//Run the powerSpawn
function runPowerSpawn(city) {
    if (Game.spawns[city]) {
        if (!Game.spawns[city].memory.powerSpawn) {
            return;
        }
        const powerSpawn = Game.getObjectById(Game.spawns[city].memory.powerSpawn);
        if (Game.time % 20 === 0) {
            if (!Game.spawns[city].memory.ferryInfo) {
                Game.spawns[city].memory.ferryInfo = {};
            }
            if (powerSpawn && powerSpawn.power < 30) {
                Game.spawns[city].memory.ferryInfo.needPower = true;
            }
            else {
                Game.spawns[city].memory.ferryInfo.needPower = false;
            }
        }
        if (settings_1.processPower && powerSpawn && powerSpawn.energy >= 50 && powerSpawn.power > 0 && powerSpawn.room.storage.store.energy > settings_1.energy.processPower && Game.cpu.bucket > settings_1.bucket.processPower) {
            powerSpawn.processPower();
        }
    }
}
function updatePowerSpawn(city, memory) {
    if (!memory.ferryInfo) {
        memory.ferryInfo = {};
    }
    const powerSpawn = _.find(Game.structures, (structure) => structure.structureType == STRUCTURE_POWER_SPAWN && structure.room.memory.city == city);
    if (powerSpawn) {
        memory.powerSpawn = powerSpawn.id;
    }
}
function initLabInfo(memory) {
    if (!memory.ferryInfo) {
        memory.ferryInfo = {};
    }
    if (!memory.ferryInfo.labInfo) {
        memory.ferryInfo.labInfo = {};
        memory.ferryInfo.labInfo.receivers = {};
        memory.ferryInfo.labInfo.reactors = {};
    }
}
function checkLabs(city) {
    const spawn = Game.spawns[city];
    const labs = _.filter(spawn.room.find(FIND_MY_STRUCTURES), structure => structure.structureType === STRUCTURE_LAB);
    if (labs.length < 3) {
        return;
    }
    initLabInfo(spawn.memory);
    //check if we need to do a rescan
    let rescan = false;
    const receivers = Object.keys(spawn.memory.ferryInfo.labInfo.receivers);
    const reactors = Object.keys(spawn.memory.ferryInfo.labInfo.reactors);
    for (let i = 0; i < receivers.length; i++) {
        if (!Game.getObjectById(receivers[i])) {
            rescan = true;
            delete (spawn.memory.ferryInfo.labInfo.receivers[receivers[i]]);
        }
    }
    for (let i = 0; i < reactors.length; i++) {
        if (!Game.getObjectById(reactors[i])) {
            rescan = true;
            delete (spawn.memory.ferryInfo.labInfo.reactors[reactors[i]]);
        }
    }
    if (labs.length > receivers.length + reactors.length) {
        rescan = true;
    }
    if (!rescan) {
        return;
    }
    //now we need a rescan, but we must make sure not to overwrite any labInfo that already exists
    const unassignedLabs = _.filter(labs, lab => !receivers.includes(lab.id) && !reactors.includes(lab.id));
    const plan = spawn.room.memory.plan;
    for (let i = 0; i < unassignedLabs.length; i++) {
        const templatePos = { "x": unassignedLabs[i].pos.x + template.offset.x - plan.x, "y": unassignedLabs[i].pos.y + template.offset.y - plan.y };
        if ((templatePos.x == template.buildings.lab.pos[0].x && templatePos.y == template.buildings.lab.pos[0].y)
            || (templatePos.x == template.buildings.lab.pos[1].x && templatePos.y == template.buildings.lab.pos[1].y)) {
            //lab is a reactor
            spawn.memory.ferryInfo.labInfo.reactors[unassignedLabs[i].id] = {};
        }
        else {
            //lab is a receiver
            spawn.memory.ferryInfo.labInfo.receivers[unassignedLabs[i].id] = {};
        }
    }
}
function updateMilitary(city, memory, rooms, spawn, creeps) {
    const flags = ["harass", "powerMine", "deposit"];
    const roles = [harasser.name, powerMiner.name, depositMiner.name];
    for (let i = 0; i < flags.length; i++) {
        const flagName = city + flags[i];
        const role = roles[i];
        updateHighwayCreep(flagName, spawn, creeps, role);
    }
}
function chooseClosestRoom(myCities, flag) {
    if (!flag) {
        return 0;
    }
    const goodCities = _.filter(myCities, city => city.controller.level >= 4 && Game.spawns[city.memory.city] && city.storage);
    if (!goodCities.length)
        return null;
    let closestRoomPos = goodCities[0].getPositionAt(25, 25);
    let closestLength = CREEP_CLAIM_LIFE_TIME + 100; //more than max claimer lifetime
    for (let i = 0; i < goodCities.length; i += 1) {
        const testRoomPos = goodCities[i].getPositionAt(25, 25);
        const testPath = utils.findMultiRoomPath(testRoomPos, flag);
        if (!testPath.incomplete && testPath.cost < closestLength && goodCities[i].name != flag.roomName) {
            closestRoomPos = goodCities[i].getPositionAt(25, 25);
            closestLength = testPath.cost;
        }
    }
    if (closestLength == 700) {
        Game.notify("No valid rooms in range for claim operation in " + flag.roomName);
    }
    return closestRoomPos.roomName;
}
function updateColonizers(city, memory, claimRoom, unclaimRoom) {
    //claimer and spawnBuilder reset
    // TODO only make a claimer if city is close
    const roomName = Game.spawns[city].room.name;
    if (roomName == claimRoom) {
        const flag = Memory.flags.claim;
        const harassFlagName = utils.generateFlagName(city + "harass");
        if (!_.find(Object.keys(Memory.flags), f => Memory.flags[f].roomName == Memory.flags.claim.roomName && f.includes("harass"))) {
            Memory.flags[harassFlagName] = new RoomPosition(25, 25, Memory.flags.claim.roomName);
            Memory.flags[harassFlagName].boosted = true;
        }
        if (Game.spawns[city].room.controller.level < 7) {
            memory[spawnBuilder.name] = 4;
        }
        else if (flag && Game.rooms[flag.roomName] && Game.rooms[flag.roomName].controller && Game.rooms[flag.roomName].controller.level > 6) {
            memory[spawnBuilder.name] = 4;
        }
        else {
            memory[spawnBuilder.name] = 2;
        }
        if (flag && Game.rooms[flag.roomName] && Game.rooms[flag.roomName].controller.my) {
            memory[claimer.name] = 0;
        }
        else {
            memory[claimer.name] = flag ? 1 : 0;
        }
    }
    else {
        memory[spawnBuilder.name] = 0;
        memory[claimer.name] = 0;
    }
    if (roomName == unclaimRoom && Game.time % 1000 == 0) {
        spawnQueue.schedule(Game.spawns[city], unclaimer.name);
    }
    //memory[rRo.name] = 0;
}
// Automated defender count for defense
function updateDefender(spawn, rcl, creeps) {
    if (Game.time % 30 != 0) {
        return;
    }
    const room = spawn.room;
    if (spawn.memory.towersActive) {
        if (rcl < 6) {
            spawn.memory[defender.name] = Math.ceil(room.find(FIND_HOSTILE_CREEPS).length / 2);
            return;
        }
        const hostiles = _.filter(room.find(FIND_HOSTILE_CREEPS), hostile => _(hostile.body).find(part => part.boost) &&
            (hostile.getActiveBodyparts(TOUGH) > 0 || hostile.body.length == 50 || rcl < 8)).length;
        if (hostiles > 3) {
            //request quad from nearest ally
            requestSupport(spawn, Math.floor(hostiles / 4), rcl);
            if (Game.time % 1500 == 0 && spawn.memory.wallMultiplier)
                spawn.memory.wallMultiplier = Math.min(spawn.memory.wallMultiplier + .1, 20);
        }
        else {
            creepUtils.scheduleIfNeeded(defender.name, Math.min(Math.floor(hostiles / 2), 4), true, spawn, creeps);
        }
    }
    else {
        spawn.memory[defender.name] = 0;
    }
    if ((rcl <= 2 || room.controller.safeModeCooldown) && !room.controller.safeMode)
        requestSupport(spawn, 1, rcl);
}
function requestSupport(spawn, quadsNeeded, rcl) {
    //find reinforce City
    const reinforceCities = _.filter(utils.getMyCities(), c => c.controller.level >= rcl);
    const closestRoom = chooseClosestRoom(reinforceCities, spawn.pos);
    if (!closestRoom)
        return;
    const reinforceCity = closestRoom + "0";
    const reinforcingSpawn = Game.spawns[reinforceCity];
    const creeps = utils.splitCreepsByCity()[reinforceCity];
    creepUtils.scheduleIfNeeded(transporter.name, 2, false, reinforcingSpawn, creeps);
    creepUtils.scheduleIfNeeded(creepNames.cN.QUAD_NAME, 4 * quadsNeeded, true, reinforcingSpawn, creeps, spawn.room.name, 400);
}
function cityFraction(cityName) {
    const myCities = _.map(utils.getMyCities(), city => city.name).sort();
    return _.indexOf(myCities, cityName) / myCities.length;
}
function updateMiner(creeps, rcl8, memory, spawn) {
    const flag = Memory.flags.claim;
    if (flag && flag.roomName === spawn.pos.roomName &&
        Game.rooms[flag.roomName].controller.level < 6) {
        memory[remoteMiner.name] = 0;
        return;
    }
    roomUtils.initializeSources(spawn);
    const powerCreep = spawn.room.find(FIND_MY_POWER_CREEPS, { filter: c => c.powers[PWR_REGEN_SOURCE] }).length;
    let bucketThreshold = settings_1.bucket.energyMining + settings_1.bucket.range * cityFraction(spawn.room.name);
    if (powerCreep || (spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] < settings_1.energy.processPower)) {
        bucketThreshold -= settings_1.bucket.range / 2;
    }
    if (spawn.memory.towersActive || (Game.cpu.bucket < bucketThreshold && rcl8) || Game.time < 500) {
        memory[remoteMiner.name] = 0;
        return;
    }
    for (const sourceId in memory.sources) {
        creepUtils.scheduleIfNeeded(creepNames.cN.REMOTE_MINER_NAME, 1, false, spawn, creeps, sourceId);
    }
}
function updateMineralMiner(rcl, buildings, spawn, creeps) {
    if (rcl > 5) {
        const extractor = _.find(buildings, structure => structure.structureType == STRUCTURE_EXTRACTOR);
        if (extractor) {
            const minerals = extractor.pos.lookFor(LOOK_MINERALS);
            if (!minerals.length)
                return;
            const mineral = minerals[0];
            const room = spawn.room;
            if (room.terminal
                && mineral.mineralAmount > 0
                && (room.terminal.store[mineral.mineralType] < 6000
                    || (Game.cpu.bucket > settings_1.bucket.mineralMining
                        && room.storage
                        && room.storage.store.getUsedCapacity(mineral.mineralType) < settings_1.mineralAmount))) {
                creepUtils.scheduleIfNeeded(creepNames.cN.MINERAL_MINER_NAME, 1, false, spawn, creeps, room.name);
            }
        }
    }
}
function updateTransporter(extensions, memory, creeps, structures, spawn) {
    if (extensions < 1 && !_.find(structures, struct => struct.structureType == STRUCTURE_CONTAINER)) {
        memory[transporter.name] = 0;
    }
    else if (extensions < 5 || creeps.length < 9) {
        memory[transporter.name] = 1;
    }
    else { //arbitrary 'load' on transporters
        memory[transporter.name] = settings_1.max.transporters;
    }
    creepUtils.scheduleIfNeeded(transporter.name, memory[transporter.name], false, spawn, creeps);
}
function updateUpgrader(city, controller, memory, rcl8, creeps, rcl) {
    const room = Game.spawns[city].room;
    if (rcl8) {
        const bucketThreshold = settings_1.bucket.upgrade + settings_1.bucket.range * cityFraction(room.name);
        const haveEnoughCpu = Game.cpu.bucket > bucketThreshold;
        if (controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[rcl] / 2
            || (controller.room.storage.store.energy > settings_1.energy.rcl8upgrade && haveEnoughCpu && settings_1.rcl8upgrade)) {
            creepUtils.scheduleIfNeeded(upgrader.name, 1, true, Game.spawns[city], creeps);
        }
    }
    else {
        const builders = _.filter(creeps, c => c.memory.role == creepNames.cN.BUILDER_NAME);
        if (builders.length > 3)
            return;
        const bank = roomUtils.getStorage(room);
        if (!bank)
            return;
        let money = bank.store[RESOURCE_ENERGY];
        const capacity = bank.store.getCapacity();
        if (rcl < 6 && Game.gcl.level <= 2) //keep us from saving energy in early game
            money += capacity * 0.2;
        if (capacity < CONTAINER_CAPACITY) {
            if (!builders.length)
                creepUtils.scheduleIfNeeded(creepNames.cN.UPGRADER_NAME, 1, false, Game.spawns[city], creeps);
            return;
        }
        let storedEnergy = bank.store[RESOURCE_ENERGY];
        for (const c of creeps) {
            if (c.room.name == controller.room.name)
                storedEnergy += c.store.energy;
        }
        const energyMultiplier = rcl > 2 ? 2 : 4;
        const needed = room.storage ? Math.floor(Math.pow((money / capacity) * 4, 3)) : Math.floor((storedEnergy * energyMultiplier / capacity));
        Log.info(`City ${city}: stored energy: ${storedEnergy}, upgraders requested: ${needed}`);
        const maxUpgraders = 7 - builders.length;
        creepUtils.scheduleIfNeeded(creepNames.cN.UPGRADER_NAME, Math.min(needed, maxUpgraders), rcl >= 6, Game.spawns[city], creeps);
        if (controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[rcl] / 2) {
            creepUtils.scheduleIfNeeded(creepNames.cN.UPGRADER_NAME, 1, rcl >= 6, Game.spawns[city], creeps);
        }
    }
}
function updateRepairer(spawn, memory, creeps) {
    const remotes = Object.keys(_.countBy(memory.sources, s => s.roomName));
    let csites = 0;
    let damagedRoads = 0;
    for (let i = 0; i < remotes.length; i++) {
        if (Game.rooms[remotes[i]] && (!Game.rooms[remotes[i]].controller || !Game.rooms[remotes[i]].controller.owner)) {
            const room = Game.rooms[remotes[i]];
            csites += room.find(FIND_MY_CONSTRUCTION_SITES).length;
            damagedRoads += room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_ROAD && s.hits / s.hitsMax < 0.3 }).length;
        }
    }
    let repairersNeeded = 0;
    if (csites > 0)
        repairersNeeded++;
    repairersNeeded += Math.floor(damagedRoads / 20);
    creepUtils.scheduleIfNeeded(repairer.name, repairersNeeded, false, spawn, creeps);
}
function updateBuilder(rcl, memory, spawn, creeps) {
    const room = spawn.room;
    const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const storage = roomUtils.getStorage(room);
    let totalSites;
    if (rcl < 4) {
        const repairSites = _.filter(room.find(FIND_STRUCTURES), structure => (structure.hits < (structure.hitsMax * 0.3))
            && (structure.structureType != STRUCTURE_WALL));
        totalSites = (Math.floor((repairSites.length) / 10) + constructionSites.length);
    }
    else {
        totalSites = constructionSites.length;
    }
    if (totalSites > 0) {
        if (storage.structureType == STRUCTURE_CONTAINER) {
            //make builders based on quantity of carried energy in room
            let energyStore = storage.store.energy;
            for (const c of creeps) {
                energyStore += c.store.energy;
            }
            const upgraders = _.filter(creeps, c => c.memory.role == creepNames.cN.UPGRADER_NAME).length;
            const buildersNeeded = Math.max(Math.floor(energyStore * 2 / CONTAINER_CAPACITY) - upgraders, 3);
            Log.info(`City ${spawn.name}: stored energy: ${energyStore}, builders requested: ${buildersNeeded}`);
            creepUtils.scheduleIfNeeded(builder.name, buildersNeeded, rcl >= 6, spawn, creeps);
        }
        else {
            creepUtils.scheduleIfNeeded(builder.name, settings_1.max.builders, rcl >= 6, spawn, creeps);
        }
    }
    else {
        memory[builder.name] = 0;
    }
    if (rcl >= 4 && Game.cpu.bucket > settings_1.bucket.repair + settings_1.bucket.range * cityFraction(room.name) && spawn.room.storage && spawn.room.storage.store[RESOURCE_ENERGY] > settings_1.energy.repair) {
        const walls = _.filter(spawn.room.find(FIND_STRUCTURES), struct => [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(struct.structureType)
            && !roomUtils.isNukeRampart(struct.pos));
        if (walls.length) { //find lowest hits wall
            if (!spawn.memory.wallMultiplier) {
                spawn.memory.wallMultiplier = 1;
            }
            if (Game.time % 10000 == 0 && Math.random() < .1)
                spawn.memory.wallMultiplier = Math.min(spawn.memory.wallMultiplier + .1, 10);
            const minHits = _.min(walls, wall => wall.hits).hits;
            const defenseMode = !spawn.room.controller.safeMode && spawn.room.controller.safeModeCooldown;
            const wallHeight = Game.gcl.level < 3 ? settings_1.wallHeight[Math.min(rcl - 1, 3)] : settings_1.wallHeight[rcl - 1] * spawn.memory.wallMultiplier;
            if (minHits < wallHeight || defenseMode) {
                creepUtils.scheduleIfNeeded(builder.name, 3, rcl >= 6, spawn, creeps);
                return;
            }
        }
        const nukes = spawn.room.find(FIND_NUKES);
        if (nukes.length) {
            const nukeStructures = _.filter(spawn.room.find(FIND_MY_STRUCTURES), struct => settings_1.nukeStructures.includes(struct.structureType));
            for (const structure of nukeStructures) {
                let rampartHeightNeeded = 0;
                for (const nuke of nukes) {
                    if (structure.pos.isEqualTo(nuke.pos)) {
                        rampartHeightNeeded += 5000000;
                    }
                    if (structure.pos.inRangeTo(nuke.pos, 2)) {
                        rampartHeightNeeded += 5000000;
                    }
                }
                if (rampartHeightNeeded == 0) {
                    continue;
                }
                const rampart = _.find(structure.pos.lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_RAMPART);
                if (!rampart) {
                    structure.pos.createConstructionSite(STRUCTURE_RAMPART);
                }
                else if (rampart.hits < rampartHeightNeeded + 30000) {
                    spawnQueue.schedule(spawn, builder.name, rcl >= 7);
                    return;
                }
            }
        }
    }
}
function updateRunner(creeps, spawn, extensions, memory, rcl, emergencyTime) {
    if (rcl == 8 && !emergencyTime && Game.cpu.bucket < settings_1.bucket.mineralMining) {
        memory[runner_1.name] = 0;
        return;
    }
    const miners = _.filter(creeps, creep => creep.memory.role == remoteMiner.name && !creep.memory.link);
    const minRunners = rcl < 7 ? 2 : 0;
    const distances = _.map(miners, miner => PathFinder.search(spawn.pos, miner.pos).cost);
    let totalDistance = _.sum(distances);
    if (extensions < 10 && Object.keys(Game.rooms).length == 1)
        totalDistance = totalDistance * 0.8; //for when there are no reservers
    const minerEnergyPerTick = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
    const energyProduced = 2 * totalDistance * minerEnergyPerTick;
    const energyCarried = types.store(types.getRecipe(4 /* runner */, spawn.room.energyCapacityAvailable, spawn.room));
    memory[runner_1.name] = Math.min(settings_1.max.runners, Math.max(Math.ceil(energyProduced / energyCarried), minRunners));
    const upgraders = _.filter(creeps, creep => creep.memory.role == upgrader.name).length;
    const bonusRunners = Math.floor(upgraders / 4);
    memory[runner_1.name] += bonusRunners;
    creepUtils.scheduleIfNeeded(runner_1.name, memory[runner_1.name], false, spawn, creeps);
}
function updateFerry(spawn, memory, rcl) {
    if (rcl >= 5) {
        memory[ferry.name] = 1;
        return;
    }
    memory[ferry.name] = 0;
}
function updateStorageLink(spawn, memory, structures) {
    if (!structures.length || !Game.getObjectById(memory.storageLink)) {
        memory.storageLink = null;
    }
    if (!spawn.room.storage) {
        return;
    }
    const storageLink = _.find(structures, structure => structure.structureType == STRUCTURE_LINK && structure.pos.inRangeTo(spawn.room.storage.pos, 3));
    if (storageLink) {
        memory.storageLink = storageLink.id;
    }
    else {
        memory.storageLink = null;
    }
}
function updateHighwayCreep(flagName, spawn, creeps, role) {
    const flagNames = _.filter(Object.keys(Memory.flags), flag => flag.includes(flagName));
    for (const flag of flagNames) {
        const boosted = role != creepNames.cN.HARASSER_NAME || Memory.flags[flag].boosted && PServ;
        const numNeeded = role == creepNames.cN.POWER_MINER_NAME && PServ ? 2 : 1;
        // distance is a very rough approximation here, so not bothering to factor in spawn time
        const route = motion.getRoute(spawn.room.name, Memory.flags[flag].roomName, true);
        const distance = route == -2 ? 0 : route.length * 50;
        creepUtils.scheduleIfNeeded(role, numNeeded, boosted, spawn, creeps, flag, distance);
    }
}
function runNuker(city) {
    const flagName = city + "nuke";
    const flag = Memory.flags[flagName];
    if (flag && !Tmp.nuked) {
        Tmp.nuked = true; //ensure that only one nuke is launched per tick (and per iteration)
        const nuker = _.find(Game.spawns[city].room.find(FIND_MY_STRUCTURES), structure => structure.structureType === STRUCTURE_NUKER);
        nuker.launchNuke(new RoomPosition(flag.x, flag.y, flag.roomName));
        delete Memory.flags[flagName];
    }
}
function setGameState() {
    // 1 spawn and no creeps = reset
    const roomNames = Object.keys(Game.rooms);
    const room = Game.rooms[roomNames[0]];
    const rcl1 = room && room.controller && room.controller.level == 1;
    const hasOneSpawn = room && room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == STRUCTURE_SPAWN).length == 1;
    const noCreeps = Object.keys(Game.creeps).length == 0;
    if (!Memory.gameState || (roomNames.length == 1 && rcl1 && hasOneSpawn && noCreeps)) {
        Object.keys(Memory).forEach(key => delete Memory[key]);
        Memory.creeps = {};
        Memory.rooms = {};
        Memory.spawns = {};
        Memory.gameState = 0;
        Memory.startTick = Game.time;
    }
}
function runEarlyGame() {
    const spawn = Object.values(Game.spawns)[0];
    if (!spawn) {
        Memory.gameState = 1;
        return;
    }
    const sources = spawn.room.find(FIND_SOURCES);
    spawnQueue.schedule(spawn, runner_1.name, false, null, 100, -5);
    spawnQueue.schedule(spawn, remoteMiner.name, false, sources[0].id, 200, -4);
    spawnQueue.schedule(spawn, runner_1.name, false, null, 100, -3);
    spawnQueue.schedule(spawn, upgrader.name, false, null, 200, -2);
    spawnQueue.schedule(spawn, remoteMiner.name, false, sources[1].id, 300, -1);
    Memory.gameState = 1;
}
function updateSpawnStress(spawn) {
    const room = spawn.room;
    const memory = spawn.memory;
    if (!memory.spawnAvailability)
        memory.spawnAvailability = 1; //start out with expected RCL1 use
    const freeSpawns = memory.sq && memory.sq.length ? 0 : _.filter(room.find(FIND_MY_SPAWNS), s => !s.spawning).length;
    memory.spawnAvailability = (memory.spawnAvailability * .9993) + (freeSpawns * 0.0007);
}
function updateRemotes(city) {
    if (Game.cpu.bucket < settings_1.bucket.mineralMining) {
        return;
    }
    const spawn = Game.spawns[city];
    const stress = spawn.memory.spawnAvailability;
    const remotes = Object.keys(_.countBy(spawn.memory.sources, s => s.roomName));
    if (remotes.length > 1 && stress < settings_1.spawnFreeTime - settings_1.spawnFreeTimeBuffer && Game.time % 500 == 5) {
        //drop least profitable remote
        Log.info(`Spawn pressure too high in ${spawn.room.name}, dropping least profitable remote...`);
        const worstRemote = roomplan.findWorstRemote(spawn.room);
        if (worstRemote) {
            Log.info(`Remote ${worstRemote.roomName} removed from ${spawn.room.name}`);
            roomplan.removeRemote(worstRemote.roomName, spawn.room.name);
        }
        else {
            Log.info("No remotes to remove");
        }
    }
    if (Game.time % 10 == 3) {
        const harasserRecipe = types.getRecipe(harasser.type, Game.spawns[city].room.energyCapacityAvailable, Game.spawns[city].room);
        const harasserSize = harasserRecipe.length;
        for (let i = 0; i < remotes.length; i++) {
            if (remotes[i] == spawn.room.name)
                continue;
            const defcon = updateDEFCON(remotes[i], harasserSize);
            if (defcon >= 4) {
                Log.info(`Remote ${remotes[i]} removed from ${spawn.room.name} due to high level threat`);
                roomplan.removeRemote(remotes[i], spawn.room.name);
                continue;
            }
            if (Game.time % 100 == 3 && Game.rooms[remotes[i]]) {
                // ensure that we can still safely path all sources in the remote
                // find all sources
                let droppedRemote = false;
                const sources = Game.rooms[remotes[i]].find(FIND_SOURCES);
                for (const source of sources) {
                    const pathLength = utils.getRemoteSourceDistance(spawn.pos, source.pos);
                    if (pathLength == -1) {
                        Log.info(`Remote ${remotes[i]} removed from ${spawn.room.name} due to inaccessable source at ${source.pos}`);
                        roomplan.removeRemote(remotes[i], spawn.room.name);
                        droppedRemote = true;
                        break;
                    }
                }
                if (droppedRemote) {
                    continue;
                }
            }
            const myCreeps = utils.splitCreepsByCity()[city];
            if (utils.isSKRoom(remotes[i])) {
                //if room is under rcl7 spawn a quad
                if (spawn.room.controller.level < 7) {
                    creepUtils.scheduleIfNeeded(creepNames.cN.QUAD_NAME, 1, false, spawn, myCreeps, remotes[i], 300);
                }
                else {
                    creepUtils.scheduleIfNeeded(creepNames.cN.SK_GUARD_NAME, 1, false, spawn, myCreeps, remotes[i], 300);
                }
            }
            if (Game.rooms[remotes[i]]) {
                const invaderCore = Game.rooms[remotes[i]].find(FIND_HOSTILE_STRUCTURES).length;
                if (invaderCore && !utils.isSKRoom(remotes[i])) {
                    const bricksNeeded = spawn.room.controller.level < 5 ? 4 : 1;
                    creepUtils.scheduleIfNeeded(creepNames.cN.BRICK_NAME, bricksNeeded, false, spawn, myCreeps, remotes[i], 100);
                }
                const reserverCost = 650;
                const controller = Game.rooms[remotes[i]].controller;
                if (spawn.room.energyCapacityAvailable >= reserverCost && controller && !controller.owner && (!controller.reservation || controller.reservation.ticksToEnd < 2000 || controller.reservation.username != settings_1.username)) {
                    const reserversNeeded = spawn.room.energyCapacityAvailable >= reserverCost * 2 ? 1 : 2;
                    creepUtils.scheduleIfNeeded(creepNames.cN.RESERVER_NAME, reserversNeeded, false, spawn, myCreeps, remotes[i], 100);
                }
            }
            if (defcon == 2) {
                creepUtils.scheduleIfNeeded(creepNames.cN.HARASSER_NAME, 1, false, spawn, myCreeps, remotes[i], 300);
            }
            if (defcon == 3) {
                creepUtils.scheduleIfNeeded(creepNames.cN.HARASSER_NAME, 2, false, spawn, myCreeps, remotes[i], 300);
                creepUtils.scheduleIfNeeded(creepNames.cN.QUAD_NAME, 4, false, spawn, myCreeps, remotes[i], 300);
            }
        }
    }
}
function updateDEFCON(remote, harasserSize) {
    //1: no threat
    //2: one harasser guard for invaders
    //3: 2 harassers and a quad TODO: dynamic defense
    //4: abandon room
    const roomInfo = utils.getsetd(Cache.roomData, remote, {});
    if (!roomInfo.d) {
        roomInfo.d = 2;
    }
    if (Game.rooms[remote]) {
        const remoteRoom = Game.rooms[remote];
        if (remoteRoom.controller && (remoteRoom.controller.owner
            || (remoteRoom.controller.reservation
                && Memory.settings.allies.includes(remoteRoom.controller.reservation.username)
                && remoteRoom.controller.reservation.username != settings_1.username))) {
            Cache.roomData[remote].d = 4;
            return Cache.roomData[remote].d;
        }
        // if room is an SK room, check for invader core
        if (utils.isSKRoom(remote)) {
            const invaderCore = _.find(remoteRoom.find(FIND_HOSTILE_STRUCTURES), s => s.structureType == STRUCTURE_INVADER_CORE);
            if (invaderCore && !invaderCore.ticksToDeploy) {
                Cache.roomData[remote].d = 4;
                // set scout time to now
                Cache.roomData[remote].sct = Game.time;
                // set safeTime to core expiry
                Cache.roomData[remote].sME = Game.time + invaderCore.effects[0].ticksRemaining;
                return Cache.roomData[remote].d;
            }
        }
        const hostiles = _.filter(utils.findHostileCreeps(Game.rooms[remote]), h => h instanceof Creep
            && h.owner.username != "Source Keeper"
            && (h.getActiveBodyparts(WORK)
                || h.getActiveBodyparts(RANGED_ATTACK)
                || h.getActiveBodyparts(ATTACK)
                || h.getActiveBodyparts(HEAL)));
        let hostileParts = 0;
        for (let i = 0; i < hostiles.length; i++) {
            const hostile = hostiles[i];
            hostileParts += hostile.body.length;
        }
        if (hostileParts > harasserSize * 6) {
            roomInfo.d = 4;
        }
        else if (hostileParts > harasserSize) {
            roomInfo.d = 3;
        }
        else if (hostileParts > 0) {
            roomInfo.d = 2;
        }
        else {
            roomInfo.d = 1;
        }
    }
    else {
        if (Game.time % 1000 == 3 && roomInfo.d == 4) {
            roomInfo.d == 3;
        }
    }
    Cache.roomData[remote].d = roomInfo.d;
    return roomInfo.d;
}
var city = {
    chooseClosestRoom: chooseClosestRoom,
    runCity: runCity,
    updateCountsCity: updateCountsCity,
    runTowers: runTowers,
    runPowerSpawn: runPowerSpawn,
    setGameState: setGameState,
    runEarlyGame: runEarlyGame,
};

//Borrowed from Sergey

const segmentID = 90;
const allyList = Memory.settings.allies;
// Priority convention:
// 1: I really need this or I'm going to die
// 0: That'd be nice I guess maybe if you really don't mind.
// Everything in between: everything in betweeen
// It's kinda important everybody has the same enums here.
const requestTypes = {
    RESOURCE: 0,
    DEFENSE: 1,
    ATTACK: 2,
    EXECUTE: 3,
    HATE: 4
};
let requestArray;
const simpleAllies = {
    // This sets foreign segments. Maybe you set them yourself for some other reason
    // Up to you to fix that.
    checkAllies() {
        try {
            if (!allyList.length)
                return;
            // Only work 10% of the time
            if (Game.time % (10 * allyList.length) >= allyList.length)
                return;
            const currentAllyName = allyList[Game.time % allyList.length];
            if (RawMemory.foreignSegment && RawMemory.foreignSegment.username == currentAllyName) {
                const allyRequests = JSON.parse(RawMemory.foreignSegment.data);
                //console.log(currentAllyName, RawMemory.foreignSegment.data)
                const requests = utils.getsetd(Cache, "requests", {});
                requests[currentAllyName] = [];
                if (!allyRequests) {
                    return;
                }
                for (const request of allyRequests) {
                    //const priority = Math.max(0, Math.min(1, request.priority))
                    switch (request.requestType) {
                        case requestTypes.ATTACK:
                            //console.log("Attack help requested!", request.roomName, priority)
                            break;
                        case requestTypes.DEFENSE:
                            //console.log("Defense help requested!", request.roomName, priority)
                            break;
                        case requestTypes.RESOURCE:
                            requests[currentAllyName].push(request);
                            // const resourceType = request.resourceType
                            // const maxAmount = request.maxAmount
                            //console.log("Resource requested!", request.roomName, request.resourceType, request.maxAmount, priority)
                            // const lowerELimit = 350000 - priority * 200000
                            // const lowerRLimit = 24000 - priority * 12000
                            break;
                    }
                }
            }
            else {
                //console.log("Simple allies either has no segment or has the wrong name?", currentAllyName)
            }
            const nextAllyName = allyList[(Game.time + 1) % allyList.length];
            RawMemory.setActiveForeignSegment(nextAllyName, segmentID);
        }
        catch (err) {
            Log.error(`Simple Allies Failure: ${err}`);
        }
    },
    // Call before making any requests
    startOfTick() {
        requestArray = [];
    },
    // Call after making all your requests
    endOfTick() {
        if (Object.keys(RawMemory.segments).length < 10) {
            RawMemory.segments[segmentID] = JSON.stringify(requestArray);
            // If you're already setting public segements somewhere this will overwrite that. You should
            // fix that yourself because I can't fix it for you.
            RawMemory.setPublicSegments([segmentID]);
        }
    },
    requestAttack(roomName, playerName, priority) {
        const request = {
            requestType: requestTypes.ATTACK,
            roomName: roomName,
            priority: priority === undefined ? 0 : priority,
            playerName: playerName
        };
        requestArray.push(request);
        if (Game.time % 10 == 0) {
            console.log(roomName, "requesting attack", "priority", priority);
        }
    },
    requestHelp(roomName, priority) {
        const request = {
            requestType: requestTypes.DEFENSE,
            roomName: roomName,
            priority: priority === undefined ? 0 : priority
        };
        requestArray.push(request);
        if (Game.time % 10 == 0) {
            console.log(roomName, "requesting help", "priority", priority);
        }
    },
    requestHate(playerName, priority) {
        const request = {
            requestType: requestTypes.HATE,
            playerName: playerName,
            priority: priority === undefined ? 0 : priority
        };
        requestArray.push(request);
        if (Game.time % 10 == 0) {
            console.log(playerName, "requesting Hait", "priority", priority);
        }
    },
    requestResource(roomName, resourceType, maxAmount, priority) {
        const request = {
            requestType: requestTypes.RESOURCE,
            resourceType: resourceType,
            maxAmount: maxAmount,
            roomName: roomName,
            priority: priority === undefined ? 0 : priority
        };
        if (Game.time % 10 == 0) ;
        requestArray.push(request);
    }
};
var swcTrading = simpleAllies;

const markets = {
    manageMarket: function (myCities) {
        if (PServ)
            swcTrading.checkAllies();
        if (Game.time % 10 != 0) {
            return;
        }
        const termCities = _.filter(myCities, c => c.terminal && Game.spawns[c.memory.city]);
        for (const city of termCities) {
            city.memory.termUsed = city.terminal.cooldown;
        }
        markets.sendCommodities(termCities);
        switch (Game.time % 1000) {
            case 0:
                markets.relocateBaseMins(termCities);
                break;
            case 40:
                markets.distributeOps(termCities);
                break;
            case 50:
                markets.distributeRepair(termCities);
                break;
        }
        if (Game.time % 50 === 0) {
            markets.distributeMinerals(termCities);
        }
        const marketOffset = Game.cpu.bucket == 10000 ? 100 : 200;
        switch (Game.time % marketOffset) {
            case 10:
                markets.distributePower(termCities);
                break;
            case 20:
                markets.distributeUpgrade(termCities);
                break;
            case 30:
                markets.buyAndSell(termCities);
                break;
        }
    },
    ///////// TOP LEVEL MARKET FUNCTIONS (There are 9) ////////
    sendCommodities: function (cities) {
        for (const city of cities) {
            const memory = Game.spawns[city.memory.city].memory;
            if (memory.ferryInfo && memory.ferryInfo.factoryInfo && memory.ferryInfo.comSend.length) {
                const comSend = memory.ferryInfo.comSend[0];
                if (Memory.rooms[city.name].termUsed) {
                    return;
                }
                if (city.terminal.store[comSend[0]] >= comSend[1]) {
                    city.terminal.send(comSend[0], comSend[1], comSend[2]);
                    Memory.rooms[city.name].termUsed = true;
                }
                memory.ferryInfo.comSend = _.drop(memory.ferryInfo.comSend);
            }
        }
    },
    distributeEnergy: function (myCities) {
        let receiver = null;
        const needEnergy = _.filter(myCities, city => city.storage && (city.storage.store.energy < settings_1.energy.processPower - 250000 || city.controller.level < 8) && city.terminal);
        if (needEnergy.length) {
            receiver = _.min(needEnergy, city => city.storage.store.energy).name;
            for (const city of myCities) {
                if (city.storage && city.storage.store.energy > Game.rooms[receiver].storage.store.energy + 150000) {
                    const memory = Game.spawns[city.memory.city].memory;
                    if (memory.ferryInfo && memory.ferryInfo.comSend) {
                        memory.ferryInfo.comSend.push([RESOURCE_ENERGY, 25000, receiver]);
                    }
                }
            }
            if (PServ) {
                swcTrading.requestResource(receiver, RESOURCE_ENERGY, 100000, 0.1);
            }
        }
        if (!_.find(myCities, city => city.controller.level == 8)) {
            //focus first city to rcl8
            const target = _.min(myCities, city => city.controller.progressTotal - city.controller.progress).name;
            for (const city of myCities) {
                if (city.name != target && city.storage && city.storage.store.energy > Game.rooms[target].storage.store.energy - 80000) {
                    const memory = Game.spawns[city.memory.city].memory;
                    if (memory.ferryInfo && memory.ferryInfo.comSend) {
                        memory.ferryInfo.comSend.push([RESOURCE_ENERGY, 25000, target]);
                    }
                }
            }
            if (target && PServ && Game.rooms[target].storage && Game.rooms[target].storage.store[RESOURCE_ENERGY] < 600000) {
                swcTrading.requestResource(target, RESOURCE_ENERGY, 100000, 0.2);
            }
        }
    },
    relocateBaseMins: function (myCities) {
        //receivers are rooms with a lvl 0 factory
        const receivers = _.filter(myCities, city => city.terminal
            && Game.spawns[city.memory.city].memory.ferryInfo
            && Game.spawns[city.memory.city].memory.ferryInfo.factoryInfo
            && !Game.spawns[city.memory.city].memory.ferryInfo.factoryInfo.factoryLevel && city.controller.level >= 7);
        //senders are rooms with a levelled factory, or no factory at all
        const senders = _.filter(myCities, city => city.terminal
            && Game.spawns[city.memory.city].memory.ferryInfo
            && Game.spawns[city.memory.city].memory.ferryInfo.factoryInfo
            && (Game.spawns[city.memory.city].memory.ferryInfo.factoryInfo.factoryLevel > 0 || city.controller.level == 6));
        const baseMins = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_UTRIUM, RESOURCE_LEMERGIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_CATALYST];
        const baseComs = [RESOURCE_SILICON, RESOURCE_METAL, RESOURCE_BIOMASS, RESOURCE_MIST];
        for (const sender of senders) {
            //if a sender has more than 8k of a base mineral, or ANY of a base commodity, send it to a random receiver
            let go = true;
            for (const baseMin of baseMins) {
                if (!go) {
                    continue;
                }
                if (sender.terminal.store[baseMin] > 8000 && !Memory.rooms[sender.name].termUsed) {
                    const amount = sender.terminal.store[baseMin] - 8000;
                    const receiver = _.min(receivers, r => r.terminal.store[baseMin]).name;
                    sender.terminal.send(baseMin, amount, receiver);
                    Memory.rooms[sender.name].termUsed = true;
                    go = false;
                }
            }
            for (const baseCom of baseComs) {
                if (!go) {
                    continue;
                }
                if (sender.terminal.store[baseCom] > 0 && !Memory.rooms[sender.name].termUsed) {
                    const amount = sender.terminal.store[baseCom];
                    const receiver = _.find(receivers, r => !r.terminal.store[baseCom] || r.terminal.store[baseCom] < 8000);
                    if (receiver) {
                        sender.terminal.send(baseCom, amount, receiver.name);
                        Memory.rooms[sender.name].termUsed = true;
                        go = false;
                    }
                    else if (sender.storage.store[baseCom] > 50000) {
                        const buyOrders = markets.sortOrder(Game.market.getAllOrders(order => order.type == ORDER_BUY
                            && order.resourceType == baseCom)).reverse();
                        if (buyOrders.length) {
                            Game.market.deal(buyOrders[0].id, Math.min(buyOrders[0].amount, 8000), sender.name);
                            go = false;
                        }
                    }
                }
            }
        }
        for (const receiver of receivers) {
            for (const baseCom of baseComs) {
                if (receiver.storage.store[baseCom] > 80000 && !Memory.rooms[receiver.name].termUsed) {
                    const amount = receiver.terminal.store[baseCom];
                    const newReceiver = _.find(receivers, r => !r.terminal.store[baseCom] || r.terminal.store[baseCom] < 8000);
                    if (newReceiver) {
                        receiver.terminal.send(baseCom, amount, newReceiver.name);
                        Memory.rooms[receiver.name].termUsed = true;
                        break;
                    }
                }
            }
        }
    },
    distributeMinerals: function (myCities) {
        let senders = myCities;
        for (const myCity of myCities) {
            const city = myCity.memory.city;
            if (!Game.spawns[city]) {
                continue;
            }
            const mineral = Game.spawns[city].memory.ferryInfo && Game.spawns[city].memory.ferryInfo.mineralRequest;
            if (mineral) {
                const x = senders.length;
                for (const sender of senders) {
                    if (!sender.terminal) {
                        continue;
                    }
                    if (sender.terminal.store[mineral] >= 6000 && !Memory.rooms[sender.name].termUsed) {
                        sender.terminal.send(mineral, 3000, myCity.name);
                        Memory.rooms[sender.name].termUsed = true;
                        senders = senders.splice(senders.indexOf(sender), 1);
                        Game.spawns[city].memory.ferryInfo.mineralRequest = null;
                        break;
                    }
                }
                if (x === senders.length && !Memory.rooms[myCity.name].termUsed) {
                    const amount = 3000;
                    const pastPrice = markets.getPrice(mineral);
                    const goodPrice = PServ ? pastPrice * 2 : pastPrice * 1.5;
                    const sellOrders = markets.sortOrder(Game.market.getAllOrders(order => order.type == ORDER_SELL
                        && order.resourceType == mineral
                        && order.amount >= amount
                        && (order.price <= goodPrice || goodPrice == 0.002)));
                    if (sellOrders.length && sellOrders[0].price * amount <= Game.market.credits) {
                        Game.market.deal(sellOrders[0].id, amount, myCity.name);
                        Game.spawns[city].memory.ferryInfo.mineralRequest = null;
                        Memory.rooms[myCity.name].termUsed = true;
                    }
                }
            }
        }
    },
    distributePower: function (myCities) {
        let receiver = null;
        const needPower = _.filter(myCities, city => city.controller.level > 7 && city.terminal && city.terminal.store.power < 1);
        if (needPower.length) {
            receiver = needPower[0].name;
            for (const city of myCities) {
                if (city.terminal && city.terminal.store.power > 2000 && !Memory.rooms[city.name].termUsed) {
                    city.terminal.send(RESOURCE_POWER, 560, receiver);
                    Memory.rooms[city.name].termUsed = true;
                    //Log.info("Sending power to " + receiver)
                }
            }
        }
    },
    distributeUpgrade: function (myCities) {
        let receiver = null;
        const needUpgrade = _.filter(myCities, city => city.controller.level > 5 && city.terminal && city.terminal.store["XGH2O"] < 1000);
        if (needUpgrade.length) {
            receiver = needUpgrade[0].name;
            for (const city of myCities) {
                if (city.terminal && city.terminal.store["XGH2O"] > 7000 && !Memory.rooms[city.name].termUsed) {
                    city.terminal.send("XGH2O", 3000, receiver);
                    Memory.rooms[city.name].termUsed = true;
                    Log.info("Sending upgrade boost to " + receiver);
                    return;
                }
            }
        }
    },
    distributeRepair: function (myCities) {
        let receiver = null;
        const needRepair = _.filter(myCities, city => city.controller.level > 5 && city.terminal && city.terminal.store["XLH2O"] < 1000);
        if (needRepair.length) {
            receiver = needRepair[0].name;
            for (const city of myCities) {
                if (city.terminal && city.terminal.store["XLH2O"] > 7000 && !Memory.rooms[city.name].termUsed) {
                    city.terminal.send("XLH2O", 3000, receiver);
                    Memory.rooms[city.name].termUsed = true;
                    Log.info("Sending repair boost to " + receiver);
                    return;
                }
            }
        }
    },
    distributeOps: function (myCities) {
        let receiver = null;
        const needOps = _.filter(myCities, city => city.controller.level == 8 && city.terminal && city.terminal.store[RESOURCE_OPS] < 300);
        if (needOps.length) {
            receiver = needOps[0].name;
            for (const city of myCities) {
                if (city.terminal && city.terminal.store[RESOURCE_OPS] > 7000 && !Memory.rooms[city.name].termUsed) {
                    city.terminal.send(RESOURCE_OPS, 5000, receiver);
                    Memory.rooms[city.name].termUsed = true;
                    Log.info("Sending power to " + receiver);
                    return;
                }
            }
        }
    },
    buyAndSell: function (termCities) {
        // cancel active orders
        for (let i = 0; i < Object.keys(Game.market.orders).length; i++) {
            if (!Game.market.orders[Object.keys(Game.market.orders)[i]].active) {
                Game.market.cancelOrder(Object.keys(Game.market.orders)[i]);
            }
        }
        // load order info
        const orders = Game.market.getAllOrders();
        Cache.marketHistory = _.groupBy(Game.market.getHistory(), history => history.resourceType);
        const buyOrders = _.groupBy(_.filter(orders, order => order.type == ORDER_BUY), order => order.resourceType);
        //const sellOrders = _.groupBy(_.filter(orders, order => order.type == ORDER_SELL), order => order.resourceType)
        const energyOrders = markets.sortOrder(buyOrders[RESOURCE_ENERGY]).reverse();
        const highEnergyOrder = energyOrders[0];
        // resources we care about
        const baseMins = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN, RESOURCE_UTRIUM, RESOURCE_LEMERGIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_CATALYST];
        const bars = [RESOURCE_UTRIUM_BAR, RESOURCE_LEMERGIUM_BAR, RESOURCE_ZYNTHIUM_BAR, RESOURCE_KEANIUM_BAR, RESOURCE_GHODIUM_MELT,
            RESOURCE_OXIDANT, RESOURCE_REDUCTANT, RESOURCE_PURIFIER, RESOURCE_CELL, RESOURCE_WIRE, RESOURCE_ALLOY, RESOURCE_CONDENSATE];
        const highTier = commodityManager.getTopTier(commodityManager.groupByFactoryLevel(termCities)).concat(["pixel"]);
        markets.updateSellPoint(highTier, termCities, buyOrders);
        //markets.sellPixels(buyOrders)
        if (PServ) {
            swcTrading.startOfTick();
        }
        markets.distributeEnergy(termCities);
        for (const city of termCities) {
            //if no terminal continue or no spawn
            if (!city.terminal || !Game.spawns[city.memory.city].memory.ferryInfo) {
                continue;
            }
            let termUsed = false; //only one transaction can be run using each cities terminal
            if (city.terminal.cooldown) {
                termUsed = true;
            }
            if (!termUsed) {
                termUsed = markets.sellOps(city, buyOrders);
            }
            const memory = Game.spawns[city.memory.city].memory;
            const level = memory.ferryInfo.factoryInfo.factoryLevel;
            //cities w/o level send all base resources to non levelled cities
            //base mins are NOT sold, they are made into bars instead.
            //bars can be sold if in excess
            //if any base mineral (besides ghodium) is low, an order for it will be placed on the market. If an order already exists, update quantity
            //if an order already exists and is above threshold (arbitrary?), increase price
            //buy minerals as needed
            if (PServ) {
                markets.requestMins(city, baseMins);
            }
            else {
                markets.buyMins(city, baseMins);
                markets.buyBoosts(city);
            }
            if (!level && !termUsed) {
                termUsed = markets.sellResources(city, bars, 3000 /*TODO make this a setting*/, city.terminal, buyOrders);
            }
            if (!termUsed) {
                termUsed = markets.sellResources(city, baseMins, 20000 /*TODO make this a setting*/, city.storage, buyOrders);
            }
            if (!termUsed && !settings_1.processPower) {
                termUsed = markets.sellResources(city, [RESOURCE_POWER], 5000 /*TODO make this a setting*/, city.terminal, buyOrders);
            }
            if (!termUsed && PServ) {
                const boosts = [RESOURCE_CATALYZED_GHODIUM_ACID, RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_KEANIUM_ACID,
                    RESOURCE_CATALYZED_KEANIUM_ALKALIDE, RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
                    RESOURCE_CATALYZED_UTRIUM_ACID, RESOURCE_CATALYZED_UTRIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ACID, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE];
                termUsed = markets.sellResources(city, boosts, 0, city.terminal, []);
            }
            //buy/sell energy
            termUsed = markets.processEnergy(city, termUsed, highEnergyOrder, energyOrders);
            //sell products
            termUsed = markets.sellProducts(city, termUsed, buyOrders, highTier);
            if (PServ) {
                swcTrading.endOfTick();
            }
            //termUsed = markets.buyPower(city, termUsed, sellOrders)
        }
    },
    //////////// BUY/SELL MARKET FUNCTIONS (There are 8) //////////////
    updateSellPoint: function (resources, cities, buyOrders) {
        if (!Memory.sellPoint) {
            Memory.sellPoint = {};
        }
        const empireStore = utils.empireStore(cities);
        for (let i = 0; i < resources.length; i++) {
            if (!Memory.sellPoint[resources[i]]) {
                Memory.sellPoint[resources[i]] === 0;
            }
            const orders = markets.sortOrder(buyOrders[resources[i]]).reverse();
            if (orders.length && orders[0].price > Memory.sellPoint[resources[i]]) {
                //if there is a higher order than what we are willing to sell for, get pickier
                Memory.sellPoint[resources[i]] = orders[0].price;
                continue;
            }
            const store = Game.resources[resources[i]] || empireStore[resources[i]];
            //otherwise, walk down sell price proportionally to how badly we need to sell
            Memory.sellPoint[resources[i]] = Memory.sellPoint[resources[i]] * (1 - (Math.pow(store, 2) / 100000000)); //100 million (subject to change)
        }
    },
    sellOps: function (city, buyOrders) {
        const storage = city.storage;
        if (!storage)
            return;
        if (storage.store[RESOURCE_OPS] > 20000) {
            const goodOrders = markets.sortOrder(buyOrders[RESOURCE_OPS]);
            if (goodOrders.length) {
                Game.market.deal(goodOrders[goodOrders.length - 1].id, Math.min(goodOrders[goodOrders.length - 1].remainingAmount, Math.max(0, storage.store[RESOURCE_OPS] - 20000)), city.name);
                Log.info(Math.min(goodOrders[goodOrders.length - 1].remainingAmount, Math.max(0, storage.store[RESOURCE_OPS] - 20000)) + " " + "ops" + " sold for " + goodOrders[goodOrders.length - 1].price);
                return true;
            }
            else {
                //make a sell order
                const orderId = _.find(Object.keys(Game.market.orders), order => Game.market.orders[order].roomName === city.name && Game.market.orders[order].resourceType === RESOURCE_OPS);
                const order = Game.market.orders[orderId];
                if (!order) {
                    const sellPrice = markets.getPrice(RESOURCE_OPS) * .90;
                    Game.market.createOrder({
                        type: ORDER_SELL,
                        resourceType: RESOURCE_OPS,
                        price: sellPrice,
                        totalAmount: 5000,
                        roomName: city.name
                    });
                }
            }
        }
        return false;
    },
    buyMins: function (city, minerals) {
        const terminal = city.terminal;
        for (let i = 0; i < minerals.length; i++) {
            const mineralAmount = terminal.store[minerals[i]];
            if (mineralAmount < 8000) {
                const amountNeeded = 8000 - mineralAmount;
                const orderId = _.find(Object.keys(Game.market.orders), order => Game.market.orders[order].roomName === city.name && Game.market.orders[order].resourceType === minerals[i]);
                const order = Game.market.orders[orderId];
                if (order && order.remainingAmount < amountNeeded) {
                    //update order quantity
                    Game.market.extendOrder(orderId, (amountNeeded - order.remainingAmount));
                }
                else if (!order) {
                    let buyPrice = markets.getPrice(minerals[i]);
                    buyPrice = buyPrice * 0.8; //start 20% below market value
                    Game.market.createOrder({
                        type: ORDER_BUY,
                        resourceType: minerals[i],
                        price: buyPrice,
                        totalAmount: amountNeeded,
                        roomName: city.name
                    });
                }
                else if (amountNeeded === 8000 || Game.time % 400 === 30) { //order already exists for max amount and has not been satisfied
                    //increment price if price is not above market value 
                    const buyPrice = markets.getPrice(minerals[i]) * 2;
                    if (order.price < buyPrice) {
                        Game.market.changeOrderPrice(orderId, (Math.max(order.price * 1.04, order.price + .001)));
                    }
                }
            }
        }
    },
    requestMins: function (city, minerals) {
        const terminal = city.terminal;
        for (let i = 0; i < minerals.length; i++) {
            const mineralAmount = terminal.store[minerals[i]];
            if (mineralAmount < 8000) {
                const amountNeeded = 8000 - mineralAmount;
                swcTrading.requestResource(city.name, minerals[i], amountNeeded, (amountNeeded * amountNeeded) / 64000000);
            }
        }
    },
    sellResources: function (city, resources, threshold, container, buyOrders) {
        if (!container)
            return;
        threshold = PServ ? threshold * 2 : threshold;
        for (const resource of resources) {
            if (container.store[resource] > threshold) {
                const sellAmount = container.store[resource] - threshold;
                const goodOrders = markets.sortOrder(buyOrders[resource]).reverse();
                if (PServ) {
                    //distribute to allies in need
                    for (const ally in Cache.requests) {
                        for (const request of Cache.requests[ally]) {
                            if (request.resourceType == resource) {
                                city.terminal.send(resource, sellAmount, request.roomName);
                            }
                        }
                    }
                }
                if (goodOrders.length && goodOrders[0].price > (0.50 * markets.getPrice(resource))) {
                    Game.market.deal(goodOrders[0].id, Math.min(Math.min(goodOrders[0].remainingAmount, sellAmount), city.terminal.store[resource]), city.name);
                    return true;
                }
            }
        }
    },
    processEnergy: function (city, termUsed, highEnergyOrder, energyOrders) {
        //can't sell if terminal has been used
        const terminal = city.terminal;
        const storage = city.storage;
        const buyThreshold = 500000;
        if (!storage) {
            return termUsed;
        }
        if (storage.store[RESOURCE_ENERGY] < buyThreshold && Game.market.credits > settings_1.creditMin) { //buy energy with excess credits
            const orderId = _.find(Object.keys(Game.market.orders), order => Game.market.orders[order].roomName === city.name && Game.market.orders[order].resourceType === RESOURCE_ENERGY);
            const order = Game.market.orders[orderId];
            let highPrice = 0;
            if (highEnergyOrder) {
                highPrice = highEnergyOrder.price;
            }
            if (!order) {
                const buyPrice = Math.max(Math.min(markets.getPrice(RESOURCE_ENERGY), highPrice), 0.001);
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: RESOURCE_ENERGY,
                    price: buyPrice,
                    totalAmount: 50000,
                    roomName: city.name
                });
            }
            else { //update order occasionally
                if (order.price <= highPrice) {
                    Game.market.changeOrderPrice(orderId, (Math.max(order.price * 1.04, order.price + .001)));
                }
            }
        }
        if (!termUsed) { //don't deal to rooms we have vision of
            if (storage.store[RESOURCE_ENERGY] > 800000) {
                for (let i = 0; i < energyOrders.length; i++) {
                    if (!Game.rooms[energyOrders[i].roomName]) {
                        Game.market.deal(energyOrders[i].id, Math.min(energyOrders[i].remainingAmount, terminal.store.energy / 2), city.name);
                        return true;
                    }
                }
            }
        }
        return termUsed;
    },
    sellProducts: function (city, termUsed, buyOrders, products) {
        if (termUsed) {
            return termUsed;
        }
        const store = city.terminal.store;
        for (let i = 0; i < products.length; i++) {
            if (store[products[i]]) {
                const orders = markets.sortOrder(buyOrders[products[i]]).reverse();
                if (orders.length && orders[0].price > Memory.sellPoint[products[i]] * 0.9) {
                    if (Game.shard.name == "shard3" && Math.random() < 0.2 && !Game.rooms["W29S31"]) {
                        city.terminal.send(products[i], Math.min(orders[0].remainingAmount, store[products[i]]), "W29S31");
                        return true;
                    }
                    Game.market.deal(orders[0].id, Math.min(orders[0].remainingAmount, store[products[i]]), city.name);
                    Log.info("Sold " + products[i] + " for: " + orders[0].price);
                    return true;
                }
            }
        }
        return false;
    },
    sellPixels: function (buyOrders) {
        const orders = markets.sortOrder(buyOrders["pixel"]).reverse();
        if (orders.length && orders[0].price > Memory.sellPoint["pixel"]) {
            Game.market.deal(orders[0].id, Math.min(orders[0].remainingAmount, Game.resources["pixel"]));
            Log.info("Sold pixels for: " + orders[0].price);
        }
    },
    buyPower: function (city, termUsed, sellOrders) {
        if (termUsed) {
            return termUsed;
        }
        const store = city.terminal.store;
        // if terminal doesn't have power then buy 5000
        if (store[RESOURCE_POWER] || Game.market.credits < settings_1.creditMin) {
            return false;
        }
        const orders = markets.sortOrder(sellOrders[RESOURCE_POWER]);
        if (!orders.length) {
            return false;
        }
        const currentPrice = markets.getPrice(RESOURCE_POWER);
        const cheapest = orders[0];
        if (cheapest.price > currentPrice || cheapest.price > settings_1.powerPrice) {
            return false;
        }
        const buyAmount = Math.min(cheapest.remainingAmount, settings_1.powerBuyVolume);
        Game.market.deal(cheapest.id, buyAmount, city.name);
        return true;
    },
    buyBoosts: function (city) {
        const boosts = settings_1.civBoosts.concat(settings_1.militaryBoosts);
        for (const boost of boosts) {
            if (city.terminal.store[boost] && city.terminal.store[boost] >= 3000)
                continue;
            const amountNeeded = 6000;
            const orderId = _.find(Object.keys(Game.market.orders), order => Game.market.orders[order].roomName === city.name && Game.market.orders[order].resourceType === boost);
            const order = Game.market.orders[orderId];
            if (order && order.remainingAmount < amountNeeded) {
                //update order quantity
                Game.market.extendOrder(orderId, (amountNeeded - order.remainingAmount));
            }
            else if (!order) {
                let buyPrice = markets.getPrice(boost);
                buyPrice = Math.min(buyPrice * 0.8, settings_1.upgradeBoostPrice); //start 20% below market value
                Game.market.createOrder({
                    type: ORDER_BUY,
                    resourceType: boost,
                    price: buyPrice,
                    totalAmount: amountNeeded,
                    roomName: city.name
                });
            }
            else if (Game.time % 800 === 30) { //order already exists for max amount and has not been satisfied
                //increment price if price is not above market value 
                const buyPrice = Math.min(markets.getPrice(boost) * 2, settings_1.upgradeBoostPrice);
                if (order.price < buyPrice) {
                    Game.market.changeOrderPrice(orderId, (Math.max(order.price * 1.04, order.price + .001)));
                }
            }
        }
    },
    //////////////// MARKET UTILS ////////////////////
    // Sort orders from low to high
    sortOrder: function (orders) {
        const sortedOrders = _.sortBy(orders, order => order.price);
        return sortedOrders;
    },
    getPrice: function (resource) {
        //determine price using history
        if (!Cache.marketHistory) {
            Cache.marketHistory = _.groupBy(Game.market.getHistory(), history => history.resourceType);
        }
        const history = Cache.marketHistory[resource];
        let totalVol = 0;
        let totalPrice = 0;
        if (!history) {
            return .001; //min price
        }
        for (let i = 0; i < history.length; i++) {
            totalVol = totalVol + history[i].volume;
            totalPrice = totalPrice + (history[i].volume * history[i].avgPrice);
        }
        const price = totalPrice / totalVol;
        return price;
    }
};
var markets_1 = markets;

let usedOnStart = 0;
let enabled = false;
let depth = 0;
function setupProfiler() {
    depth = 0; // reset depth, this needs to be done each tick.
    Game.profiler = {
        stream(duration, filter) {
            setupMemory("stream", duration || 10, filter);
        },
        email(duration, filter) {
            setupMemory("email", duration || 100, filter);
        },
        profile(duration, filter) {
            setupMemory("profile", duration || 100, filter);
        },
        background(filter) {
            setupMemory("background", false, filter);
        },
        restart() {
            if (Profiler.isProfiling()) {
                const filter = Memory.profiler.filter;
                let duration = false;
                if (Memory.profiler.disableTick) {
                    // Calculate the original duration, profile is enabled on the tick after the first call,
                    // so add 1.
                    duration = Memory.profiler.disableTick - Memory.profiler.enabledTick + 1;
                }
                const type = Memory.profiler.type;
                setupMemory(type, duration, filter);
            }
        },
        reset: resetMemory,
        output: Profiler.output,
    };
    overloadCPUCalc();
}
function setupMemory(profileType, duration, filter) {
    resetMemory();
    const disableTick = Number.isInteger(duration) ? Game.time + duration : false;
    if (!Memory.profiler) {
        Memory.profiler = {
            map: {},
            totalTime: 0,
            enabledTick: Game.time + 1,
            disableTick,
            type: profileType,
            filter,
        };
    }
}
function resetMemory() {
    Memory.profiler = null;
}
function overloadCPUCalc() {
    if (Game.rooms.sim) {
        usedOnStart = 0; // This needs to be reset, but only in the sim.
        Game.cpu.getUsed = function getUsed() {
            // performance is only defined in the sim world
            return performance.now() - usedOnStart;
        };
    }
}
function getFilter() {
    return Memory.profiler.filter;
}
const functionBlackList = [
    "getUsed",
    "constructor", // es6 class constructors need to be called with `new`
];
function wrapFunction(name, originalFunction) {
    if (originalFunction.profilerWrapped) {
        return;
    }
    function wrappedFunction() {
        if (Profiler.isProfiling()) {
            const nameMatchesFilter = name === getFilter();
            const start = Game.cpu.getUsed();
            if (nameMatchesFilter) {
                depth++;
            }
            const result = originalFunction.apply(this, arguments);
            if (depth > 0 || !getFilter()) {
                const end = Game.cpu.getUsed();
                Profiler.record(name, end - start);
            }
            if (nameMatchesFilter) {
                depth--;
            }
            return result;
        }
        return originalFunction.apply(this, arguments);
    }
    wrappedFunction.profilerWrapped = true;
    wrappedFunction.toString = () => `// screeps-profiler wrapped function:\n${originalFunction.toString()}`;
    return wrappedFunction;
}
function hookUpPrototypes() {
    Profiler.prototypes.forEach(proto => {
        profileObjectFunctions(proto.val, proto.name);
    });
}
function profileObjectFunctions(object, label) {
    const objectToWrap = object.prototype ? object.prototype : object;
    Object.getOwnPropertyNames(objectToWrap).forEach(functionName => {
        const extendedLabel = `${label}.${functionName}`;
        const isBlackListed = functionBlackList.indexOf(functionName) !== -1;
        if (isBlackListed) {
            return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(objectToWrap, functionName);
        if (!descriptor) {
            return;
        }
        const hasAccessor = descriptor.get || descriptor.set;
        if (hasAccessor) {
            const configurable = descriptor.configurable;
            if (!configurable) {
                return;
            }
            const profileDescriptor = {
                get: function () { return 0; },
                set: function () { return 0; }
            };
            if (descriptor.get) {
                const extendedLabelGet = `${extendedLabel}:get`;
                profileDescriptor.get = profileFunction(descriptor.get, extendedLabelGet);
            }
            if (descriptor.set) {
                const extendedLabelSet = `${extendedLabel}:set`;
                profileDescriptor.set = profileFunction(descriptor.set, extendedLabelSet);
            }
            Object.defineProperty(objectToWrap, functionName, profileDescriptor);
            return;
        }
        const isFunction = typeof descriptor.value === "function";
        if (!isFunction) {
            return;
        }
        const originalFunction = objectToWrap[functionName];
        objectToWrap[functionName] = profileFunction(originalFunction, extendedLabel);
    });
    return objectToWrap;
}
function profileFunction(fn, functionName) {
    const fnName = functionName || fn.name;
    if (!fnName) {
        Log.info("Couldn't find a function name for - " + fn);
        Log.info("Will not profile this function.");
        return fn;
    }
    return wrapFunction(fnName, fn);
}
const Profiler = {
    results: {
        stats: []
    },
    printProfile() {
        // Log.info(Profiler.output())
        Profiler.output();
    },
    emailProfile() {
        Game.notify(Profiler.output(1000));
    },
    output(passedOutputLengthLimit) {
        const outputLengthLimit = passedOutputLengthLimit || 1000;
        if (!Memory.profiler || !Memory.profiler.enabledTick) {
            return "Profiler not active.";
        }
        const endTick = Math.min(Memory.profiler.disableTick || Game.time, Game.time);
        const startTick = Memory.profiler.enabledTick + 1;
        const elapsedTicks = endTick - startTick;
        const header = "calls\t\ttime\t\tavg\t\tfunction";
        const footer = [
            `Avg: ${(Memory.profiler.totalTime / elapsedTicks).toFixed(2)}`,
            `Total: ${Memory.profiler.totalTime.toFixed(2)}`,
            `Ticks: ${elapsedTicks}`,
        ].join("\t");
        const lines = [header];
        let currentLength = header.length + 1 + footer.length;
        const allLines = Profiler.lines();
        let done = false;
        while (!done && allLines.length) {
            const line = allLines.shift();
            // each line added adds the line length plus a new line character.
            if (currentLength + line.length + 1 < outputLengthLimit) {
                lines.push(line);
                currentLength += line.length + 1;
            }
            else {
                done = true;
            }
        }
        lines.push(footer);
        return lines.join("\n");
    },
    lines() {
        const stats = Object.keys(Memory.profiler.map).map(functionName => {
            const functionCalls = Memory.profiler.map[functionName];
            return {
                name: functionName,
                calls: functionCalls.calls,
                totalTime: functionCalls.time,
                averageTime: functionCalls.time / functionCalls.calls,
            };
        }).sort((val1, val2) => {
            return val2.totalTime - val1.totalTime;
        });
        Profiler.results.stats = stats;
        const lines = stats.map(data => {
            return [
                data.calls,
                data.totalTime.toFixed(1),
                data.averageTime.toFixed(3),
                data.name,
            ].join("\t\t");
        });
        return lines;
    },
    prototypes: [
        { name: "Game", val: Game },
        { name: "Room", val: Room },
        { name: "Structure", val: Structure },
        { name: "Spawn", val: Spawn },
        { name: "Creep", val: Creep },
        { name: "RoomPosition", val: RoomPosition },
        { name: "Source", val: Source },
        { name: "Flag", val: Flag },
    ],
    record(functionName, time) {
        if (!Memory.profiler.map[functionName]) {
            Memory.profiler.map[functionName] = {
                time: 0,
                calls: 0,
            };
        }
        Memory.profiler.map[functionName].calls++;
        Memory.profiler.map[functionName].time += time;
    },
    endTick() {
        if (Game.time >= Memory.profiler.enabledTick) {
            const cpuUsed = Game.cpu.getUsed();
            Memory.profiler.totalTime += cpuUsed;
            Profiler.report();
        }
    },
    report() {
        if (Profiler.shouldPrint()) {
            Profiler.printProfile();
        }
        else if (Profiler.shouldEmail()) {
            Profiler.emailProfile();
        }
    },
    isProfiling() {
        if (!enabled || !Memory.profiler) {
            return false;
        }
        return !Memory.profiler.disableTick || Game.time <= Memory.profiler.disableTick;
    },
    type() {
        return Memory.profiler.type;
    },
    shouldPrint() {
        const streaming = Profiler.type() === "stream";
        const profiling = Profiler.type() === "profile";
        const onEndingTick = Memory.profiler.disableTick === Game.time;
        return streaming || (profiling && onEndingTick);
    },
    shouldEmail() {
        return Profiler.type() === "email" && Memory.profiler.disableTick === Game.time;
    },
};
var screepsProfiler = {
    wrap(callback) {
        if (enabled) {
            setupProfiler();
        }
        if (Profiler.isProfiling()) {
            usedOnStart = Game.cpu.getUsed();
            // Commented lines are part of an on going experiment to keep the profiler
            // performant, and measure certain types of overhead.
            // var callbackStart = Game.cpu.getUsed();
            const returnVal = callback();
            // var callbackEnd = Game.cpu.getUsed();
            Profiler.endTick();
            // var end = Game.cpu.getUsed();
            // var profilerTime = (end - start) - (callbackEnd - callbackStart);
            // var callbackTime = callbackEnd - callbackStart;
            // var unaccounted = end - profilerTime - callbackTime;
            // Log.info('total-', end, 'profiler-', profilerTime, 'callbacktime-',
            // callbackTime, 'start-', start, 'unaccounted', unaccounted);
            return returnVal;
        }
        return callback();
    },
    enable() {
        enabled = true;
        hookUpPrototypes();
    },
    results: Profiler.results,
    output: Profiler.output,
    registerObject: profileObjectFunctions,
    registerFN: profileFunction,
    registerClass: profileObjectFunctions,
};

const statsLib = {
    cityCpuMap: {},
    benchmark: function (myCities) {
        if (!Memory.benchmark) {
            Memory.benchmark = {};
        }
        if (!myCities.length)
            return;
        const maxRcl = _.max(myCities, city => city.controller.level).controller.level;
        const gcl = Game.gcl.level;
        if (!Memory.benchmark["rcl" + maxRcl] && maxRcl > 1)
            Memory.benchmark["rcl" + maxRcl] = Game.time - Memory.startTick;
        if (!Memory.benchmark["gcl" + gcl] && gcl > 1)
            Memory.benchmark["gcl" + gcl] = Game.time - Memory.startTick;
    },
    collectStats: function (myCities) {
        for (const creep of Object.values(Game.creeps)) {
            const ccache = utils.getCreepCache(creep.id);
            const rcache = utils.getRoomCache(creep.room.name);
            if (utils.getsetd(ccache, "lastHits", creep.hits) > creep.hits) {
                ccache.attacks = utils.getsetd(ccache, "attacks", 0) + 1;
                rcache.attacks = utils.getsetd(rcache, "attacks", 0) + 1;
            }
            ccache.lastHits = creep.hits;
        }
        //stats
        if (Game.time % settings_1.statTime == 1 && Game.time - Memory.data.lastReset > 5) {
            const stats = {};
            stats["cpu.getUsed"] = Memory.avgCpu;
            stats["cpu.bucket"] = Game.cpu.bucket;
            stats["gcl.progress"] = Game.gcl.progress;
            stats["gcl.progressTotal"] = Game.gcl.progressTotal;
            stats["gcl.level"] = Game.gcl.level;
            stats["gcl.total"] =
                GCL_MULTIPLY * Math.pow(Game.gcl.level, GCL_POW) + Game.gcl.progress;
            stats["gpl.progress"] = Game.gpl.progress;
            stats["gpl.progressTotal"] = Game.gpl.progressTotal;
            stats["gpl.level"] = Game.gpl.level;
            stats["gpl.total"] =
                POWER_LEVEL_MULTIPLY * Math.pow(Game.gpl.level, POWER_LEVEL_POW) + Game.gpl.progress;
            stats["energy"] = utils.getDropTotals();
            const heapStats = Game.cpu.getHeapStatistics();
            stats["heap.available"] = heapStats["total_available_size"];
            const cities = [];
            _.forEach(Object.keys(Game.rooms), function (roomName) {
                const room = Game.rooms[roomName];
                const city = Game.rooms[roomName].memory.city;
                cities.push(city);
                if (room.controller && room.controller.my) {
                    stats["cities." + city + ".rcl.level"] = room.controller.level;
                    stats["cities." + city + ".rcl.progress"] = room.controller.progress;
                    stats["cities." + city + ".rcl.progressTotal"] = room.controller.progressTotal;
                    stats["cities." + city + ".spawn.energy"] = room.energyAvailable;
                    stats["cities." + city + ".spawn.energyTotal"] = room.energyCapacityAvailable;
                    if (room.storage) {
                        stats["cities." + city + ".storage.energy"] = room.storage.store.energy;
                        const factory = _.find(room.find(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_FACTORY);
                        if (factory) {
                            stats["cities." + city + ".factory.level"] = factory.level;
                            stats["cities." + city + ".factory.cooldown"] = factory.cooldown;
                        }
                    }
                    stats["cities." + city + ".cpu"] = statsLib.cityCpuMap[city];
                    // Record construction progress in the city
                    const sites = room.find(FIND_CONSTRUCTION_SITES);
                    stats[`cities.${city}.sites.progress`] =
                        _.reduce(sites, (sum, site) => sum + site.progress, 0);
                    stats[`cities.${city}.sites.progressTotal`] =
                        _.reduce(sites, (sum, site) => sum + site.progressTotal, 0);
                    // observer scans
                    const rcache = utils.getRoomCache(room.name);
                    stats[`cities.${city}.scans`] = rcache.scans || 0;
                    rcache.scans = 0;
                }
                const rcache = utils.getRoomCache(roomName);
                stats[`rooms.${roomName}.attacks`] = rcache.attacks;
                rcache.attacks = 0;
            });
            const counts = _.countBy(Game.creeps, creep => creep.memory.role);
            const creepsByRole = _.groupBy(Game.creeps, creep => creep.memory.role);
            const roles$1 = roles.getRoles();
            _.forEach(roles$1, function (role) {
                if (counts[role.name]) {
                    stats[`creeps.${role.name}.count`] = counts[role.name];
                }
                else {
                    stats[`creeps.${role.name}.count`] = 0;
                }
                const creeps = creepsByRole[role.name] || [];
                const attackList = _.map(creeps, creep => utils.getCreepCache(creep.id).attacks);
                stats[`creeps.${role.name}.attacks`] = _.sum(attackList);
                for (const creep of creeps) {
                    const ccache = utils.getCreepCache(creep.id);
                    ccache.attacks = 0;
                }
            });
            // City level stats
            const cityCounts = _.countBy(Game.creeps, creep => creep.memory.city);
            _.forEach(cities, function (city) {
                if (!city) {
                    return;
                }
                if (cityCounts[city]) {
                    stats["cities." + city + ".count"] = cityCounts[city];
                }
                else {
                    stats["cities." + city + ".count"] = 0;
                }
                stats["cities." + city + ".deposits"] = 0;
                stats["cities." + city + ".minerals"] = 0;
                const spawn = Game.spawns[city];
                if (spawn) {
                    // Record the weakest wall in each city
                    const buildings = spawn.room.find(FIND_STRUCTURES);
                    const walls = _.filter(buildings, building => building.structureType == STRUCTURE_WALL);
                    const minWall = _.min(_.toArray(_.map(walls, wall => wall.hits)));
                    stats["cities." + city + ".wall"] = walls.length > 0 ? minWall : 0;
                }
            });
            // Mining stats
            _.forEach(Game.creeps, creep => {
                const city = creep.memory.city;
                if (creep.memory.role == depositMiner.name) {
                    stats["cities." + city + ".deposits"] += creep.memory.mined;
                    creep.memory.mined = 0;
                }
                else if (creep.memory.role == mineralMiner.name) {
                    stats[`cities.${city}.minerals`] += creep.memory.mined;
                    creep.memory.mined = 0;
                }
            });
            stats["market.credits"] = Game.market.credits;
            if (screepsProfiler.results && screepsProfiler.results.stats) {
                const pstats = screepsProfiler.results.stats;
                const profileSize = Math.min(settings_1.profileResultsLength, pstats.length);
                for (let i = 0; i < profileSize; i++) {
                    const result = pstats[i];
                    stats[`profiler.${result.name}.calls`] = result.calls;
                    stats[`profiler.${result.name}.time`] = result.totalTime.toFixed(1);
                }
            }
            if (Cache.bucket) {
                stats["cpu.bucketfillRateMax"] = Cache.bucket.fillRate;
                stats["cpu.waste"] = Cache.bucket.waste;
                Cache.bucket.waste = 0;
            }
            // Resources
            if (Game.time % settings_1.resourceStatTime == 1) {
                const citiesWithTerminals = _.filter(myCities, c => c.terminal);
                const empireStore = utils.empireStore(citiesWithTerminals);
                for (const resource of RESOURCES_ALL) {
                    stats[`resource.${resource}`] = empireStore[resource];
                }
            }
            // Enemies
            for (const enemy in Cache.enemies) {
                stats[`enemies.${enemy}`] = Cache.enemies[enemy];
                Cache.enemies[enemy] = 0;
            }
            RawMemory.segments[0] = JSON.stringify(stats);
        }
    }
};
var stats = statsLib;

const ob = {
    run: function (city) {
        const roomName = city.substring(0, city.length - 1);
        const rcache = utils.getRoomCache(roomName);
        rcache.scanned = false;
        const remainder = Game.time % settings_1.observerFrequency;
        if (remainder == 0) {
            ob.observeNewRoomForMining(city);
        }
        else if (remainder == 1) {
            ob.placeMiningFlags(city);
        }
    },
    scanRoom: function () {
        const observer = ob.getUnusedObserver();
        if (!observer)
            return false;
        ob.scanNextRoom(observer);
        return true;
    },
    recordRoomData: function () {
        const roomsToScan = Cache["roomsToScan"];
        if (!roomsToScan) {
            return;
        }
        const roomDataCache = utils.getsetd(Cache, "roomData", {});
        for (const room in Game.rooms) {
            const roomData = utils.getsetd(roomDataCache, room, {});
            if (!roomData.sct || roomData.sct < Game.time) {
                ob.recordData(room, roomData);
                delete roomsToScan[room];
            }
        }
    },
    recordData: function (roomName, roomData) {
        const room = Game.rooms[roomName];
        if (!room) { // We don't have vision for some reason
            return;
        }
        if (room.controller) {
            roomData.sMC = room.controller.safeModeCooldown && (Game.time + room.controller.safeModeCooldown) || 0;
            roomData.own = (room.controller.owner && room.controller.owner.username) || undefined;
            roomData.rcl = room.controller.level || 0;
            roomData.ctrlP = utils.packPos(room.controller.pos);
            roomData.min = room.find(FIND_MINERALS)[0].mineralType;
            roomData.res = (room.controller.reservation && room.controller.reservation.username) || undefined;
            if (room.controller.safeMode) {
                roomData.sME = room.controller.safeMode + Game.time;
            }
        }
        const sources = room.find(FIND_SOURCES);
        roomData.src = {};
        for (const source of sources) {
            roomData.src[source.id] = utils.packPos(source.pos);
        }
        const skLairs = _.filter(room.find(FIND_HOSTILE_STRUCTURES), struct => struct.structureType == STRUCTURE_KEEPER_LAIR);
        if (skLairs && skLairs.length) {
            roomData.skL = skLairs.map(lair => utils.packPos(lair.pos));
            const core = _.find(room.find(FIND_HOSTILE_STRUCTURES), struct => struct.structureType == STRUCTURE_INVADER_CORE);
            roomData.rcl = core && !core.ticksToDeploy ? core.level : 0;
            roomData.sME = core && !core.ticksToDeploy ? core.effects[0].ticksRemaining + Game.time : 0;
            roomData.sct = roomData.sME || Game.time + settings_1.scouting.sk;
        }
        else {
            const scoutTime = room.controller ? settings_1.scouting.controllerRoom[roomData.rcl] : settings_1.scouting.highway;
            roomData.sct = Game.time + scoutTime;
        }
    },
    getUnusedObserver: function () {
        const obsCity = _.find(utils.getMyCities(), city => !utils.getRoomCache(city.name).scanned
            && utils.getRoomCache(city.name).scannerTargets
            && utils.getRoomCache(city.name).scannerTargets.length
            && _.find(city.find(FIND_MY_STRUCTURES), struct => struct.structureType == STRUCTURE_OBSERVER));
        return obsCity && _.find(obsCity.find(FIND_MY_STRUCTURES), struct => struct.structureType == STRUCTURE_OBSERVER);
    },
    scanNextRoom: function (observer) {
        const target = ob.getScannerTarget(observer);
        observer.observeRoom(target);
        const rcache = utils.getRoomCache(observer.room.name);
        rcache.scanned = true; // flag scanner as used
        rcache.scans = (rcache.scans || 0) + 1; // Record stats for scans
    },
    getScannerTarget: function (observer) {
        const rcache = utils.getRoomCache(observer.room.name);
        if (!rcache.scannerTargets) {
            ob.findRoomsForScan();
        }
        return rcache.scannerTargets.shift();
    },
    findRoomsForScan: function () {
        let roomList = [];
        const cities = _.filter(utils.getMyCities(), c => c.controller.level >= 4);
        const lowLevel = _.filter(utils.getMyCities(), c => c.controller.level < 4);
        for (const city of lowLevel) {
            const roomPos = utils.roomNameToPos(city.name);
            roomList = roomList.concat(utils.generateRoomList(roomPos[0] - 1, roomPos[1] - 1, 3, 3)); //3 by 3
        }
        for (const city of cities) {
            const roomPos = utils.roomNameToPos(city.name);
            roomList = roomList.concat(utils.generateRoomList(roomPos[0] - OBSERVER_RANGE, roomPos[1] - OBSERVER_RANGE, (OBSERVER_RANGE * 2) + 1, (OBSERVER_RANGE * 2) + 1)); //21 by 21
        }
        const roomsToScan = new Set(roomList);
        const roomDataCache = utils.getsetd(Cache, "roomData", {});
        for (const roomName of roomsToScan) {
            const roomData = utils.getsetd(roomDataCache, roomName, {});
            if (Game.map.getRoomStatus(roomName).status != "normal" || roomData.sct && roomData.sct > Game.time) {
                roomsToScan.delete(roomName);
                continue;
            }
            const obsRoom = _.find(cities, city => city.controller.level == 8 && Game.map.getRoomLinearDistance(roomName, city.name) <= OBSERVER_RANGE);
            if (obsRoom) {
                const rcache = utils.getRoomCache(obsRoom.name);
                const targets = utils.getsetd(rcache, "scannerTargets", []);
                targets.push(roomName);
                continue;
            }
            //if no rooms have an obs in range, we'll need a nearby room to send a scout
            const scoutRooms = _.filter(cities.concat(lowLevel), city => (Game.map.getRoomLinearDistance(roomName, city.name) <= OBSERVER_RANGE)
                || Game.map.getRoomLinearDistance(roomName, city.name) <= 1);
            const scoutRoom = _.min(scoutRooms, city => Game.map.getRoomLinearDistance(roomName, city.name));
            const rcache = utils.getRoomCache(scoutRoom.name);
            const targets = utils.getsetd(rcache, "scannerTargets", []);
            targets.push(roomName);
        }
        Cache.roomsToScan = roomsToScan;
    },
    observeNewRoomForMining: function (city) {
        const obs = ob.getObsForMining(city);
        if (!obs)
            return false;
        ob.preparePowerRoomsList(city, settings_1.miningRange);
        const roomNum = ob.timeToRoomNum(Game.time, city);
        //scan next room
        obs.observeRoom(Game.spawns[city].memory.powerRooms[roomNum]);
        const rcache = utils.getRoomCache(obs.room.name);
        rcache.scanned = true;
    },
    placeMiningFlags: function (city) {
        const obs = ob.getObsForMining(city);
        if (!obs || !Game.spawns[city].memory.powerRooms || !Game.spawns[city].memory.powerRooms.length)
            return false;
        const roomNum = ob.timeToRoomNum(Game.time - 1, city);
        const roomName = Game.spawns[city].memory.powerRooms[roomNum];
        if (!Game.rooms[roomName]) { //early return if room wasn't scanned
            return;
        }
        if (Game.rooms[roomName].controller) {
            Game.spawns[city].memory.powerRooms.splice(roomNum, 1);
            return;
        }
        const structures = Game.rooms[roomName].find(FIND_STRUCTURES);
        const modifier = (Math.pow(Math.random(), (1 / 4))) * settings_1.bucket.range;
        if (Game.map.getRoomLinearDistance(Game.spawns[city].room.name, roomName) <= settings_1.powerMiningRange && Game.cpu.bucket >= settings_1.bucket.powerMining + modifier - (settings_1.bucket.range / 2)) {
            ob.flagPowerBanks(structures, city, roomName);
        }
        if (Game.cpu.bucket >= settings_1.bucket.resourceMining) {
            ob.flagDeposits(structures, city, roomName);
        }
    },
    timeToRoomNum: function (time, city) {
        return Math.floor(time / settings_1.observerFrequency) % Game.spawns[city].memory.powerRooms.length;
    },
    getObsForMining: function (city) {
        if ((!Game.spawns[city]) || settings_1.miningDisabled.includes(city)) {
            return false;
        }
        const buildings = Game.spawns[city].room.find(FIND_MY_STRUCTURES);
        return _.find(buildings, structure => structure.structureType === STRUCTURE_OBSERVER);
    },
    preparePowerRoomsList: function (city, range) {
        if (Game.spawns[city].memory.powerRooms) {
            return;
        }
        Game.spawns[city].memory.powerRooms = [];
        const myRoom = Game.spawns[city].room.name;
        const pos = utils.roomNameToPos(myRoom);
        for (let i = -range; i < +range; i++) {
            const jRange = range - Math.abs(i);
            for (let j = -jRange; j < +jRange; j++) {
                const coord = [pos[0] + i, pos[1] + j];
                const roomName = utils.roomPosToName(coord);
                if (utils.isHighway(roomName)) {
                    Game.spawns[city].memory.powerRooms.push(roomName);
                }
            }
        }
    },
    flagPowerBanks: function (structures, city, roomName) {
        const powerBank = _.find(structures, structure => structure.structureType === STRUCTURE_POWER_BANK);
        const flagName = utils.generateFlagName(city + "powerMine");
        if (powerBank && powerBank.power > 1500 && powerBank.ticksToDecay > 2800 &&
            structures.length < 30 && Game.spawns[city].room.storage.store.energy > settings_1.energy.powerMine) {
            const terrain = Game.rooms[roomName].getTerrain();
            if (!ob.isBlockedByWalls(terrain, powerBank.pos) && !ob.checkFlags(powerBank.pos)) {
                utils.placeFlag(flagName, powerBank.pos, Game.time + powerBank.ticksToDecay);
                Log.info("Power Bank found in: " + roomName);
            }
        }
    },
    flagDeposits: function (structures, city, roomName) {
        //flag deposits
        if (structures.length >= 30) {
            return false;
        }
        const deposits = Game.rooms[roomName].find(FIND_DEPOSITS);
        if (!deposits.length) {
            return false;
        }
        for (let i = 0; i < deposits.length; i++) {
            const depositFlagName = utils.generateFlagName(city + "deposit");
            if (deposits[i].lastCooldown < 5 && !ob.checkFlags(deposits[i].pos)) {
                utils.placeFlag(depositFlagName, deposits[i].pos, Game.time + settings_1.depositFlagRemoveTime);
                Memory.flags[depositFlagName] = deposits[i].pos;
                Memory.flags[depositFlagName].harvested = Math.floor(Math.pow((deposits[i].lastCooldown / 0.001), 1 / 1.2));
            }
        }
    },
    checkFlags: function (roomPos) {
        const flags = Object.keys(Memory.flags);
        return _(flags).find(flagName => {
            const flag = Memory.flags[flagName];
            const flagPos = new RoomPosition(flag.x, flag.y, flag.roomName);
            return flagPos.isEqualTo(roomPos);
        });
    },
    // True if a point is surrounded by terrain walls
    isBlockedByWalls: function (terrain, pos) {
        let walls = 0;
        for (let i = -1; i <= +1; i++) {
            for (let j = -1; j <= +1; j++) {
                const result = terrain.get(pos.x + i, pos.y + j);
                if (result == TERRAIN_MASK_WALL) {
                    walls++;
                }
            }
        }
        return walls >= 8;
    }
};
var observer = ob;

const b = {
    SIZE: 10000,
    manage: function () {
        Memory.avgCpu = Memory.avgCpu == undefined ? 0 : (Memory.avgCpu * .999) + (Game.cpu.getUsed() * .001);
        if (Game.time % 1000 == 2) {
            const cities = utils.getMyCities();
            if (Memory.avgCpu / Game.cpu.limit > settings_1.removeRemote || Game.cpu.bucket < 9500)
                roomplan.dropRemote(cities);
            if (Memory.avgCpu / Game.cpu.limit < settings_1.addRemote)
                roomplan.searchForRemote(cities);
        }
        if (b.growingTooQuickly()) {
            const wasteAmount = Game.cpu.bucket == b.SIZE ? 50 : 1;
            b.wasteCpu(wasteAmount);
        }
    },
    growingTooQuickly: function () {
        Cache.bucket = Cache.bucket || {};
        Cache.bucket.waste = Cache.bucket.waste || 0;
        const oldBucket = Cache.bucket.amount;
        const newBucket = Game.cpu.bucket;
        Cache.bucket.amount = newBucket;
        if (!oldBucket)
            return false;
        const delta = newBucket - oldBucket;
        const oldRate = Cache.bucket.fillRate || 0;
        Cache.bucket.fillRate = 0.99 * oldRate + 0.01 * delta;
        const percentEmpty = 1 - Game.cpu.bucket / b.SIZE;
        return (Cache.bucket.fillRate > percentEmpty * settings_1.bucket.growthLimit || Game.cpu.bucket == b.SIZE);
    },
    wasteCpu: function (amount) {
        Cache.bucket.waste += Math.max(Game.cpu.limit + amount - Game.cpu.getUsed(), 0);
        let spawnedScouts = false;
        while (Game.cpu.getUsed() < Game.cpu.limit + amount) {
            //military.attack()
            if (!observer.scanRoom()) {
                if (!spawnedScouts) {
                    b.spawnScouts();
                    spawnedScouts = true;
                }
                if (roomplan.judgeNextRoom())
                    break;
            }
        }
    },
    spawnScouts: function () {
        if (Game.time % 500 != 0)
            return;
        const cities = utils.getMyCities();
        const rcl8 = _.find(cities, city => city.controller.level == 8);
        if (!rcl8)
            observer.findRoomsForScan();
        for (const city of cities) {
            if (city.controller.level < 8) {
                const rcache = utils.getRoomCache(city.name);
                const targets = utils.getsetd(rcache, "scannerTargets", []);
                if (targets.length) {
                    const spawn = Game.spawns[city.memory.city];
                    if (spawn)
                        creepUtils.scheduleIfNeeded(creepNames.cN.SCOUT_NAME, 1, false, spawn, utils.splitCreepsByCity()[city.name]);
                }
            }
        }
    }
};
var bucket = b;

screepsProfiler.registerObject(actions_1, "actions");
screepsProfiler.registerObject(breaker, "breaker");
screepsProfiler.registerObject(builder, "builder");
screepsProfiler.registerObject(city, "city");
screepsProfiler.registerObject(claimer, "claimer");
screepsProfiler.registerObject(commodityManager, "commodityManager");
screepsProfiler.registerObject(defender, "defender");
screepsProfiler.registerObject(depositMiner, "depositMiner");
screepsProfiler.registerObject(error_1, "error");
screepsProfiler.registerObject(factory, "factory");
screepsProfiler.registerObject(ferry, "ferry");
screepsProfiler.registerObject(harasser, "harasser");
screepsProfiler.registerObject(labs_1, "labs");
screepsProfiler.registerObject(link, "link");
screepsProfiler.registerObject(markets_1, "markets");
screepsProfiler.registerObject(medic, "medic");
screepsProfiler.registerObject(mineralMiner, "mineralMiner");
screepsProfiler.registerObject(observer, "observer");
screepsProfiler.registerObject(powerCreep, "powerCreep");
screepsProfiler.registerObject(powerMiner, "powerMiner");
screepsProfiler.registerObject(quad, "quad");
screepsProfiler.registerObject(remoteMiner, "remoteMiner");
screepsProfiler.registerObject(robber, "robber");
screepsProfiler.registerObject(roles, "roles");
screepsProfiler.registerObject(roomplan, "roomplan");
screepsProfiler.registerObject(runner_1, "runner");
screepsProfiler.registerObject(settings_1, "settings");
screepsProfiler.registerObject(spawnBuilder, "spawnBuilder");
screepsProfiler.registerObject(spawnQueue, "spawnQueue");
screepsProfiler.registerObject(stats, "stats");
screepsProfiler.registerObject(template, "template");
screepsProfiler.registerObject(tower_1, "tower");
screepsProfiler.registerObject(transporter, "transporter");
screepsProfiler.registerObject(types, "types");
screepsProfiler.registerObject(unclaimer, "unclaimer");
screepsProfiler.registerObject(upgrader, "upgrader");
screepsProfiler.registerObject(utils, "utils");
screepsProfiler.registerObject(repairer, "repairer");

var globals = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });




commonjsGlobal.Tmp = {};
commonjsGlobal.T = function () { return `Time: ${Game.time}`; };
commonjsGlobal.Cache = { roomData: {} };
commonjsGlobal.Log = {};
Log.info = function (text) { console.log(`<p style="color:yellow">[INFO] ${Game.time}: ${text}</p>`); };
Log.error = function (text) { console.log(`<p style="color:red">[ERROR] ${Game.time}: ${text}</p>`); };
Log.warning = function (text) { console.log(`<p style="color:orange">[WARNING] ${Game.time}: ${text}</p>`); };
Log.console = function (text) { console.log(`<p style="color:green">[CONSOLE] ${Game.time}: ${text}</p>`); };
commonjsGlobal.AddAlly = function (username) {
    Memory.settings.allies.push(username);
    Log.console(`Added ${username} to allies. Current allies are ${Memory.settings.allies}`);
};
commonjsGlobal.BuyUnlock = function (price, amount) {
    if (Game.market.createOrder({
        type: ORDER_BUY,
        resourceType: CPU_UNLOCK,
        price: price,
        totalAmount: amount,
    }) == OK)
        return Log.console(`Order created for ${amount} unlock(s) at ${price} apiece`);
    Log.error("Order failed. Please use BuyUnlock (float price, int amount)");
    return -1;
};
commonjsGlobal.SpawnQuad = function (city, boosted, flagName = city + "quadRally") {
    if (!Game.spawns[city]) {
        Log.error("Invalid city name. Use SpawnQuad(string city, bool boosted, string destination)");
        return -1;
    }
    military.spawnQuad(city, boosted, flagName);
    return Log.console(`Spawning Quad from ${city}`);
};
commonjsGlobal.SpawnBreaker = function (city, boosted) {
    if (!Game.spawns[city]) {
        Log.error("Invalid city name. Use SpawnBreaker(string city, bool boosted)");
        return -1;
    }
    spawnQueue.initialize(Game.spawns[city]);
    spawnQueue.schedule(Game.spawns[city], "medic", boosted);
    spawnQueue.schedule(Game.spawns[city], "breaker", boosted);
    return Log.console(`Spawning Breaker and Medic from ${city}`);
};
commonjsGlobal.SpawnRole = function (role, city, boosted, flagName) {
    if (!Game.spawns[city]) {
        Log.error("Invalid city name. Use SpawnRole(string role, string city, bool boosted)");
        return -1;
    }
    spawnQueue.initialize(Game.spawns[city]);
    spawnQueue.schedule(Game.spawns[city], role, boosted, flagName);
    return Log.console(`Spawning ${role} from ${city}`);
};
commonjsGlobal.PlaceFlag = function (flagName, x, y, roomName, duration) {
    Memory.flags[flagName] = new RoomPosition(x, y, roomName);
    duration = duration || 20000;
    Memory.flags[flagName].removeTime = Game.time + duration;
    return Log.console(`${flagName} flag placed in ${roomName}, will decay in ${duration} ticks`);
};
commonjsGlobal.DeployQuad = function (roomName, boosted) {
    military.deployQuad(roomName, boosted);
    return Log.console(`Deploying Quad to ${roomName}`);
};
commonjsGlobal.RoomWeights = function (roomName) {
    roomplan.planRoom(roomName);
};
commonjsGlobal.PServ = (!Game.shard.name.includes("shard") || Game.shard.name == "shardSeason");
commonjsGlobal.RequestResource = function (roomName, resourceType, maxAmount, priority) {
    swcTrading.startOfTick();
    swcTrading.requestResource(roomName, resourceType, maxAmount, priority);
    swcTrading.endOfTick();
};
commonjsGlobal.PCAssign = function (name, city, shard) {
    const creep = Game.powerCreeps[name];
    if (!creep) {
        Log.error("invalid PC name");
        return -1;
    }
    if (!Game.spawns[city]) {
        Log.error("Invalid city name. Use PCAssign(string name, string city, string shard)");
        return -2;
    }
    creep.memory.city = Game.spawns[city].room.name;
    creep.memory.shard = shard || Game.shard.name;
    return Log.console(`${name} has been assigned to ${city} on ${creep.memory.shard}`);
};
commonjsGlobal.RemoveJunk = function (city) {
    Log.info("Attempting to remove junk...");
    const terminal = Game.spawns[city].room.terminal;
    const coms = _.without(_.difference(Object.keys(COMMODITIES), Object.keys(REACTIONS)), RESOURCE_ENERGY);
    const unleveledFactory = _.find(Game.structures, struct => struct instanceof StructureFactory
        && struct.my && !struct.level && struct.room.terminal && struct.room.controller.level >= 7);
    if (!unleveledFactory) {
        Log.info("No destination found");
        return;
    }
    const destination = unleveledFactory.room.name;
    for (let i = 0; i < Object.keys(terminal.store).length; i++) {
        if (_.includes(coms, Object.keys(terminal.store)[i])) {
            //send com to a level 0 room
            Log.info(`Removing: ${Object.keys(terminal.store)[i]}`);
            Game.spawns[city].memory.ferryInfo.comSend.push([Object.keys(terminal.store)[i], terminal.store[Object.keys(terminal.store)[i]], destination]);
        }
    }
};
commonjsGlobal.RemoveConstruction = function () {
    for (const id in Game.constructionSites) {
        Game.constructionSites[id].remove();
    }
};
commonjsGlobal.DropRemote = function (remoteRoomName) {
    if (!Memory.remotes[remoteRoomName]) {
        Log.error("Invalid room name. Use dropRemote(string roomName)");
    }
    delete Memory.remotes[remoteRoomName];
    // loop through all spawns and remove any sources that have this roomName
    for (const spawnName in Game.spawns) {
        const spawn = Game.spawns[spawnName];
        if (spawn.memory.sources) {
            for (const sourceId in spawn.memory.sources) {
                if (spawn.memory.sources[sourceId].roomName == remoteRoomName) {
                    delete spawn.memory.sources[sourceId];
                    Log.console(`Removed source ${sourceId} in ${remoteRoomName} from ${spawnName}`);
                }
            }
        }
    }
};
commonjsGlobal.CleanCities = function () {
    const u = utils;
    const rU = roomUtils;
    const cM = commodityManager;
    const cities = _.filter(Game.rooms, room => room.controller && room.controller.my
        && _.find(room.find(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_FACTORY));
    Log.info(`Cities with a factory: ${cities}`);
    const citiesByFactoryLevel = cM.groupByFactoryLevel(cities);
    Log.info(JSON.stringify(citiesByFactoryLevel));
    for (const level of Object.values(citiesByFactoryLevel)) {
        for (const city of level) {
            const factory = rU.getFactory(city);
            const memory = Game.spawns[city.memory.city].memory;
            if (memory.ferryInfo.factoryInfo.produce == "dormant") {
                //empty factory (except for energy)
                Log.info(`Emptying factory in ${city.name}...`);
                for (const resource of Object.keys(factory.store)) {
                    if (resource != RESOURCE_ENERGY) {
                        Log.info(`Removing ${resource}`);
                        memory.ferryInfo.factoryInfo.transfer.push([resource, 0, factory.store[resource]]);
                    }
                }
                if (factory.level) { //only leveled factories need to send back components
                    Log.info(`Cleaning Terminal in ${city.name}...`);
                    for (const resource of Object.keys(city.terminal.store)) {
                        //send back components
                        if (COMMODITIES[resource]
                            && !REACTIONS[resource]
                            && resource != RESOURCE_ENERGY
                            && COMMODITIES[resource].level != factory.level) {
                            const comLevel = COMMODITIES[resource].level || 0;
                            const receiver = citiesByFactoryLevel[comLevel][0].name;
                            Log.info(`Sending ${resource} to ${receiver}`);
                            const amount = city.terminal.store[resource];
                            const ferryInfo = u.getsetd(memory, "ferryInfo", {});
                            const comSend = u.getsetd(ferryInfo, "comSend", []);
                            comSend.push([resource, amount, receiver]);
                        }
                    }
                }
            }
        }
    }
};
});

unwrapExports(globals);

//room data storage and refresh on global reset
/*
Shorthand and uses
sMC => safeModeCooldown: obs, roomplan
sME => safeMode end tick: obs, military
own => owner: military, obs, roomplan, motion
rcl => rcl: military, obs, roomplan, visuals, motion
ctrlP => controller position: obs, roomplan, visuals
src => source IDs: obs, roomplan
min => mineralType: obs, roomplan
skL => source keeper lair positions: obs, motion
sct => scout time: obs, roomplan, scout
s => score: roomplan, visuals
c => template center: roomplan
sT => room is unsafe until this tick: roomplan
cB = claim block: roomplan, spawnBuilder

NOTE: all positions stored as packed postions. Use utils.unPackPos to get a roomPos



*/


const data = {
    updateData: function () {
        if (!Memory.data) {
            Memory.data = {
                lastReset: 0,
                section: 0, //section being uploaded to. Always recover from other section
            };
        }
        data.checkReset();
        data.recoverData();
        //150k chars ~= 165kb
        //373k => 427kb ~4000 rooms
        //~3 cpu for 87k chars ~100kb, so probably ~30 cpu per tick for backing up data
        //backup every 1k ticks for 4 ticks => <0.2cpu/tick avg
        //load data into  both 1-20 and 21 - 40
        //if one side gets corrupted we can recover from the other side
        //otherwise we will update both sides in one 4 tick session
    },
    checkReset: function () {
        if (!Cache.time || Cache.time != Game.time - 1) {
            Memory.data.lastReset = Game.time;
        }
        Cache.time = Game.time;
    },
    recoverData: function () {
        const s = (Memory.data.section + 1) % 2 ? 21 : 1;
        switch (Game.time - Memory.data.lastReset) {
            case 0:
                //load first half of data
                Log.info("Resetting cache...");
                RawMemory.setActiveSegments([s, s + 1, s + 2, s + 3, s + 4, s + 5, s + 6, s + 7, s + 8, s + 9]);
                break;
            case 1:
                //read in first half of data
                data.readData(s, false);
                //load second half of data
                if (Cache.dataString)
                    RawMemory.setActiveSegments([s + 10, s + 11, s + 12, s + 13, s + 14, s + 15, s + 16, s + 17, s + 18, s + 19]);
                break;
            case 2:
                //read in second half of data
                data.readData(s, true);
                break;
            default:
                return;
        }
    },
    readData: function (startSeg, continuing) {
        if (continuing && !Cache.dataString)
            return;
        if (!Cache.dataString)
            Cache.dataString = "";
        for (let i = startSeg; i < startSeg + 10; i++) {
            const segment = RawMemory.segments[i];
            if (!segment || !segment.length) {
                data.uploadData();
                break;
            }
            Cache.dataString += segment;
        }
        if (continuing && Cache.dataString) { //auto upload if we're using exactly 20 segments
            data.uploadData();
        }
    },
    uploadData: function () {
        if (!Cache.dataString.length) {
            delete Cache.dataString;
            return;
        }
        try {
            Cache.roomData = JSON.parse(Cache.dataString);
        }
        catch (error) {
            const msg = "Out of storage for roomData. Resetting...";
            Log.error(msg);
            Game.notify(msg);
        }
        Log.info("Cache reset complete");
        delete Cache.dataString;
    },
    backupData: function () {
        var _a;
        //don't backup during stats update or recovery
        //backup to section, then toggle section upon completion
        if (Game.time - ((_a = Memory.data) === null || _a === void 0 ? void 0 : _a.lastReset) < 2)
            return;
        switch (Game.time % (settings_1.statTime * settings_1.backupTime)) {
            case 2:
            case 4:
                //backup first half to section
                data.startBackup();
                break;
            case 3:
            case 5:
                //continue backup if needed
                data.continueBackup();
                break;
            default:
                return;
        }
    },
    startBackup: function () {
        const startSeg = Memory.data.section ? 21 : 1;
        Cache.dataString = JSON.stringify(Cache.roomData);
        for (let i = startSeg; i < startSeg + 10; i++) {
            const dataString = Cache.dataString;
            if (!dataString || !dataString.length) {
                RawMemory.segments[i] = "";
                continue;
            }
            const breakPoint = data.getBreakPoint(dataString);
            RawMemory.segments[i] = dataString.substring(0, breakPoint);
            Cache.dataString = dataString.substring(breakPoint);
            if (breakPoint == dataString.length) {
                Memory.data.section = (Memory.data.section + 1) % 2;
            }
        }
    },
    continueBackup: function () {
        const startSeg = Memory.data.section ? 31 : 11;
        for (let i = startSeg; i < startSeg + 10; i++) {
            const dataString = Cache.dataString;
            if (!dataString || !dataString.length) {
                RawMemory.segments[i] = "";
                continue;
            }
            const breakPoint = data.getBreakPoint(dataString);
            RawMemory.segments[i] = dataString.substring(0, breakPoint);
            if (breakPoint == dataString.length) {
                Memory.data.section = (Memory.data.section + 1) % 2;
                delete Cache.dataString;
            }
            if (i == startSeg + 6 && Cache.dataString) {
                const msg = "roomData storage running low";
                Log.warning(msg);
                Game.notify(msg, 1440);
            }
            Cache.dataString = dataString.substring(breakPoint);
        }
    },
    getBreakPoint: function (str) {
        let bytes = 0, codePoint, next, i = 0;
        while (i < str.length && bytes < 99900) {
            codePoint = str.charCodeAt(i);
            // Lone surrogates cannot be passed to encodeURI
            if (codePoint >= 0xD800 && codePoint < 0xDC00 && i + 1 < str.length) {
                next = str.charCodeAt(i + 1);
                if (next >= 0xDC00 && next < 0xE000) {
                    bytes += 4;
                    i += 2;
                    continue;
                }
            }
            bytes += (codePoint < 0x80 ? 1 : (codePoint < 0x800 ? 2 : 3));
            i++;
        }
        return i;
    },
    makeVisuals: function () {
        if (Game.cpu.bucket >= 9800) {
            //TODO: visuals should be its own file
            if (Cache.roomData) {
                for (const roomName of Object.keys(Cache.roomData)) {
                    const roomInfo = Cache.roomData[roomName];
                    if (roomInfo.ctrlP) {
                        const pos = utils.unpackPos(roomInfo.ctrlP, roomName);
                        Game.map.visual.circle(pos, { fill: "#FF0000", radius: 2 });
                    }
                    if (roomInfo.src && Object.keys(roomInfo.src).length) {
                        for (const source in roomInfo.src) {
                            Game.map.visual.circle(utils.unpackPos(roomInfo.src[source], roomName), { fill: "#00FF00", radius: 2 });
                        }
                    }
                    if (roomInfo.rcl) {
                        Game.map.visual.text(roomInfo.rcl, new RoomPosition(25, 15, roomName), { color: "#00FF00", fontSize: 10 });
                    }
                    if (roomInfo.s) {
                        Game.map.visual.text(roomInfo.s, new RoomPosition(25, 35, roomName), { color: "#00FF00", fontSize: 10 });
                    }
                }
            }
        }
    }
};
var data_1 = data;

var main = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = void 0;

















//Code to manually profile:
//Game.profiler.profile(1000);
//Game.profiler.output();
//Code to claim a new room:
//Memory.flags["W11N190break"] = new RoomPosition(25,25,"W16N21")
//Memory.flags["claim"] = new RoomPosition(25,25,"W16N21")
//Memory.flags["plan"] = new RoomPosition(30,33,"W16N21")
//  Resources/CPU    | Buying Price (CR) | Selling Price (CR)
//   250 energy      |    20   CR        |   10 CR
//   1.6 commodities |    25   CR        |   25   CR
//   .85 power       |    3.45 CR        |   3.45 CR
// Control vs Power
// Power =>   4 CR / power
// Control => 50 control / CPU. 25 CR/CPU => 2 CR / control
city.setGameState();
screepsProfiler.enable();
function loop() {
    screepsProfiler.wrap(function () {
        RawMemory.setActiveSegments([]);
        commonjsGlobal.Tmp = {};
        data_1.updateData();
        error_1.reset();
        if (Game.cpu.bucket < 50 && Game.shard.name != "shard1" && Game.time > 50) {
            Log.error("Bucket too low");
            Game.notify(`Bucket hit minimum threshold at tick ${Game.time}`);
            return;
        }
        if (Game.shard.name == "shard1" && Game.cpu.bucket == 10000) {
            Game.cpu.generatePixel();
        }
        const localRooms = utils.splitRoomsByCity(); // only used for remote mining?
        const localCreeps = utils.splitCreepsByCity();
        const myCities = utils.getMyCities();
        let claimRoom, unclaimRoom;
        if (Memory.gameState == 0)
            city.runEarlyGame();
        // TODO add a setup function to validate memory etc
        if (!Memory.flags)
            Memory.flags = {};
        if (Game.time % 500 == 0) {
            const f = Memory.flags;
            claimRoom = city.chooseClosestRoom(myCities, (f.claim && f.claimRally) || f.claim);
            unclaimRoom = city.chooseClosestRoom(myCities, (f.unclaim && f.unclaimRally) || f.unclaim);
            //em.expand() // grow the empire!
        }
        //run cities
        let prevCpu = Game.cpu.getUsed();
        for (let i = 0; i < myCities.length; i += 1) {
            try {
                if (Game.cpu.bucket - prevCpu < 10) {
                    return;
                }
                const city$1 = utils.getsetd(myCities[i].memory, "city", myCities[i].name + "0");
                const rcl = myCities[i].controller.level;
                const rclLimit = settings_1.bucket.colony - rcl * settings_1.bucket.rclMultiplier;
                if (rcl < 8 && Game.cpu.bucket < rclLimit && Game.gcl.level > 1) {
                    continue; // skip this city
                }
                city.updateCountsCity(city$1, localCreeps[city$1] || [], localRooms[city$1], claimRoom, unclaimRoom);
                city.runCity(city$1, localCreeps[city$1]);
                city.runTowers(city$1);
                // TODO: obs runs in dead cities
                observer.run(city$1);
                const currentCpu = Game.cpu.getUsed();
                stats.cityCpuMap[city$1] = currentCpu - prevCpu;
                prevCpu = currentCpu;
            }
            catch (failedCityError) {
                error_1.reportError(failedCityError);
            }
        }
        //run power creeps
        _.forEach(Game.powerCreeps, function (powerCreep$1) {
            powerCreep.run(powerCreep$1);
        });
        //gather homeless creeps
        if (Game.time % 50 == 1) {
            _.forEach(Game.creeps, function (creep) {
                if (!creep.memory.role) {
                    creep.memory.role = creep.name.split("-")[0];
                }
                if (!creep.memory.city) {
                    creep.memory.city = "homeless";
                    creep.memory.mode = 0;
                }
            });
        }
        //run homeless creeps (1 tick delay)
        if (localCreeps["homeless"]) {
            const allRoles = roles.getRoles();
            const nameToRole = _.groupBy(allRoles, role => role.name);
            _.forEach(localCreeps["homeless"], (creep) => {
                nameToRole[creep.memory.role][0].run(creep);
            });
        }
        //clear old creeps
        if (Game.time % 100 === 0) {
            for (const name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                }
            }
        }
        //clear rooms
        if (Game.time % 5000 === 0) {
            for (const name in Memory.rooms) {
                if (!Memory.rooms[name].city) {
                    delete Memory.rooms[name];
                }
            }
            utils.removeConstruction();
        }
        markets_1.manageMarket(myCities);
        const noobMode = Object.keys(Game.rooms).length < 5;
        if (Game.time % settings_1.roomplanTime == settings_1.roomplanOffset
            || (Game.time % 10 == 0 && noobMode && Game.cpu.bucket > 1000)
            || (Game.time % 50 == 0 && Game.cpu.bucket > 9900)) {
            roomplan.buildConstructionSites();
        } // TODO: this could go in run city?
        observer.recordRoomData();
        if (Game.time % settings_1.scouting.assessTime == 0)
            observer.findRoomsForScan();
        if (Game.time % settings_1.cMTime == settings_1.cMOffset && !PServ) { //run commodity manager every 400 (lower than lowest batched reaction time, on the 39 so it'll be before dormant period ends)
            if (Game.time % settings_1.cMTime * 10 == settings_1.cMOffset) {
                commodityManager.cleanCities(myCities);
            }
            else {
                commodityManager.runManager(myCities);
            }
        }
        if (Game.time % settings_1.flagCleanup)
            utils.cleanFlags();
        data_1.makeVisuals();
        data_1.backupData();
        // disable emailing
        utils.silenceCreeps();
        // clean room memory
        if (Game.time % 50 === 0) {
            roomUtils.removeOldRoomMemory();
        }
        stats.collectStats(myCities);
        if (Game.time % 7 == 4) {
            stats.benchmark(myCities);
        }
        if (Game.time % settings_1.profileFrequency == 0) {
            Game.profiler.profile(settings_1.profileLength);
        }
        // burn extra cpu if the bucket is filling too quickly
        bucket.manage();
        // This will always be last. Throw an exception if any city failed.
        error_1.finishTick();
    });
}
exports.loop = loop;
});

var main$1 = unwrapExports(main);
var main_1 = main.loop;

exports.default = main$1;
exports.loop = main_1;
