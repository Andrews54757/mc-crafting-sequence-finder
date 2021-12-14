const glob = require("./glob");
const fs = require("fs");
let dt = glob(__dirname + '/recipes/*.json').map(file =>{
    return {
        name: file.split("/").pop().split(".")[0],
  //      file: file,
        ...JSON.parse(fs.readFileSync(file, "utf8"))
    }
}).filter((o)=> o.type.indexOf("crafting") != -1)
var types = ["minecraft:crafting_shaped", "minecraft:crafting_shapeless"];
dt = dt.filter((d)=>{
    if (types.includes(d.type)) {
        return true;
    }
    console.log("Filtered crafting " + d.type)
    return false;
}).filter((d)=>{
    if (d.type == types[0]) {
        let unique = 0;
        let ingreds = 0;
        let seen = {};
        d.pattern.forEach((line)=>{
            const ln = line.split("");
            ln.forEach((c)=>{
                if (c == " ") return;
                if (!seen[c]) {
                    seen[c] = true;
                    unique++;
                }
                ingreds++;
            })
        })
        if (ingreds <= 4) {
            console.log("Shaped fittable " + d.name)
            return false;
        }
        if (unique <= 1) {
            console.log("Shaped fittable 2 " + d.name)
            return false;
        }
    } else if (d.type == types[1]) {
        if (d.ingredients.length <= 4) {
            console.log("Shapeless fittable " + d.name)
            return false;
        }
        let count = 0;
        let seen = {};
        d.ingredients.forEach((ing)=>{
            if (!seen[ing.item]) {
                seen[ing.item] = true;
                count++;
            }
        })
        if (count <= 1) {
            console.log("Shapeless fittable 2 " + d.name)
            return false;
        }
    }
    return true;
})

const blacklist = ["cake", "dispenser", "beetroot_soup", "rabbit_stew_from_brown_mushroom", "rabbit_stew_from_red_mushroom"]

dt = dt.filter((d)=>{
    return !blacklist.includes(d.name)
});

const tablesSeen = [];

dt = dt.filter((d)=>{
    const table = [0,0,0,0,0,0,0,0,0];

    let nextType = 1;
    var seen = {};
    if (d.type == types[0]) {
        d.pattern.forEach((line, row)=>{
            const ln = line.split("");
            ln.forEach((c, column)=>{
                if (c == " ") return;
                if (!seen[c]) {
                    seen[c] = nextType++;
                }
                let typeid = seen[c];
    
                table[row * 3 + column] = typeid;
            })
        })
    } else
    if (d.type == types[1]) {
       
        d.ingredients.forEach((ing, index)=>{
            if (!seen[ing.item]) {
                seen[ing.item] = nextType++;
            }
            let typeid = seen[ing.item];

            table[index] = typeid;
        })
    }

    d.table = table.join("");

    if (tablesSeen[d.table]) {
        console.log("Seen recipe pattern " + d.name)
        return false;
    }
    tablesSeen[d.table] = true;
    return true;
})

dt = dt.map((d)=>{
    return {
        name: d.name,
        table: d.table
    }
})

fs.writeFileSync(__dirname + "/recipes.json",JSON.stringify(dt,null,4))