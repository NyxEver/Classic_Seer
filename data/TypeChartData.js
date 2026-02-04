/**
 * TypeChartData - 属性克制表
 * 直接定义数据避免 CORS 问题
 */

const TypeChartData = {
    typeChart: {
        water: {
            fire: 2,
            ground: 2,
            water: 0.5,
            grass: 0.5,
            normal: 1,
            flying: 1,
            electric: 1,
            ice: 1,
            mechanical: 1
        },
        fire: {
            grass: 2,
            mechanical: 2,
            ice: 2,
            water: 0.5,
            fire: 0.5,
            normal: 1,
            flying: 1,
            electric: 1,
            ground: 1
        },
        grass: {
            water: 2,
            ground: 2,
            grass: 0.5,
            fire: 0.5,
            flying: 0.5,
            mechanical: 0.5,
            normal: 1,
            electric: 1,
            ice: 1
        },
        electric: {
            water: 2,
            flying: 2,
            ground: 0,
            electric: 0.5,
            grass: 1,
            fire: 1,
            normal: 1,
            ice: 1,
            mechanical: 1
        },
        normal: {
            water: 1,
            fire: 1,
            grass: 1,
            electric: 1,
            normal: 1,
            flying: 1,
            ground: 1,
            ice: 1,
            mechanical: 1
        },
        flying: {
            grass: 2,
            electric: 0.5,
            ice: 0.5,
            water: 1,
            fire: 1,
            normal: 1,
            flying: 1,
            ground: 1,
            mechanical: 1
        },
        ground: {
            fire: 2,
            electric: 2,
            mechanical: 2,
            flying: 0,
            grass: 0.5,
            water: 0.5,
            ice: 0.5,
            normal: 1
        },
        ice: {
            grass: 2,
            flying: 2,
            ground: 2,
            fire: 0.5,
            mechanical: 0.5,
            ice: 0.5,
            water: 1,
            electric: 1,
            normal: 1
        },
        mechanical: {
            ice: 2,
            ground: 0.5,
            fire: 0.5,
            water: 1,
            grass: 1,
            electric: 1,
            normal: 1,
            flying: 1,
            mechanical: 1
        }
    },
    typeNames: {
        water: "水",
        fire: "火",
        grass: "草",
        electric: "电",
        normal: "普通",
        flying: "飞行",
        ground: "地面",
        ice: "冰",
        mechanical: "机械"
    }
};

window.TypeChartData = TypeChartData;
