function perm(s) {
    var permArr = [],
        usedChars = [];

    function permute(input) {
        var i, ch;
        for (i = 0; i < input.length; i++) {
            ch = input.splice(i, 1)[0];
            usedChars.push(ch);
            if (input.length == 0) {
                permArr.push(usedChars.slice());
            }
            permute(input);
            input.splice(i, 0, ch);
            usedChars.pop();
        }
        return permArr
    };
    return permute(s);
}
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(__dirname + "/recipes.json", "utf8"));
data.forEach((o) => {
    o.table = o.table.split("").map(o => parseInt(o))
})
console.log(`Found ${data.length} patterns!`)
const permutations = perm([0, 1, 2, 3, 4, 5, 6, 7, 8])
console.log(`Simulating ${permutations.length} sequences!`)

let result = [];



permutations.forEach((sequence, index) => {
    var counts = [];


    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < data.length; i++) {

            let queue = fillQueueReal(data[i].table, sequence, j);

            let result = simulate(data[i].table, queue);

            if (!result.success) {
                console.log(`[${index + 1}/${permutations.length}] Failed sequence ${sequence.join(", ")}`);
                return;
            }
            counts.push(result.count);
        }
    }
    result.push({
        sequence: sequence,
        counts: counts
    })
    console.log(`[${index + 1}/${permutations.length}] Found valid sequence ${sequence.join(", ")}`);
})
console.log(`Found ${result.length} valid sequences!`)

function simulate(table, queue) {
    let playerSlotCount = 0;
    const playerSlots = [0, 0, 0, 0, 0];


    const ratios = [0, 0, 0, 0, 0];
    table.forEach((item) => {
        ratios[item]++;
    })

    let count = 0;
    let maxSlots = 4 * 9;
    while (true) {




        // Fill player slots
        for (let i = playerSlotCount; i < maxSlots; i++) {
            if (queue.length === 0) break;
            let item = queue.shift();
            playerSlots[item.item] += item.count;
            playerSlotCount++;
        }


        // Fill partial player slots
        for (let j = 0; j < queue.length; j++) {
            let slot = playerSlots[queue[j].item];
            let remainder = slot % 64;
            if (remainder === 0) continue;
            let toFill = Math.min(queue[j].count, 64 - remainder);
            queue[j].count -= toFill;
            playerSlots[queue[j].item] += toFill;
            if (queue[j].count === 0) {
                queue.splice(j, 1);
                j--;
            }
        }


        let limitingFactor = Infinity;
        for (let i = 1; i < playerSlots.length; i++) {
            if (ratios[i] === 0) continue;
            let factor = Math.floor(playerSlots[i] / ratios[i]);
            if (factor < limitingFactor) {
                limitingFactor = factor;
            }
        }

        if (limitingFactor === 0) {
            break;
        }


        playerSlotCount = 0;
        for (let i = 1; i < playerSlots.length; i++) {
            let toRemove = ratios[i] * limitingFactor;
            playerSlots[i] = playerSlots[i] - toRemove;
            playerSlotCount += Math.ceil(playerSlots[i] / 64);
        }
        count++;
    }

    if (playerSlotCount === 0 && queue.length !== 0) {
        throw "Unexpected end of simulation";
    }

    return {
        success: playerSlotCount === 0 && queue.length === 0,
        count: count
    }
}
function median(values) {
    if (values.length === 0) throw new Error("No inputs");

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

result.forEach((res) => {
    let total = 0;

    res.counts.forEach((count) => {
        total += count;
    })


    res.total = total;
    res.average = total / res.counts.length;

    let variance = 0;
    res.counts.forEach((count) => {
        variance += Math.pow(count - res.average, 2);
    });
    variance = variance / (res.counts.length - 1);

    res.variance = variance;
    res.median = median(res.counts.slice(0))

    res.counts = res.counts.join(",")

})


function fillQueueReal(table, sequence, startIndex) {
    const queue = [];
    let id = startIndex;
    let subarrs = [[], [], [], []];
    sequence.forEach((index) => {
        const item = table[index];
        if (item === 0) return;
        for (let j = 0; j < 27; j++) {
            let currId = id++;
            subarrs[currId % 4].push({
                item: item,
                count: 64
            });
        }
    })

    for (let i = 0; i < 4; i++) {
        queue.push(...subarrs[i]);
    }
    return queue;
}




result.sort((a, b) => {
    return a.total - b.total;
})

result.forEach((res) => {
    res.sequence = res.sequence.join("");
});

fs.writeFileSync(__dirname + "/result.json", JSON.stringify(result, null, 4))