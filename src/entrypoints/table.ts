import * as dom from "../utils/dom.ts"
import * as random from "../utils/random.ts";
import * as genially from "../utils/genially.ts";

import * as finder from "../core/finder.ts";
import { Container } from "../core/container.ts";
import { Settings } from "../settings.ts";
import { game } from "../games/table.ts";

dom.init();
main();

async function main() {

    // Wait until the table is loaded and initialize the game
    const elems = await finder.awaitFor("table");

    // Get the game table (assuming the first)
    const table = elems[0] as HTMLTableElement;
    if (!table)
        throw new Error("Table not found");

    // Get any parameters and set everything it up
    const { idx, min, max, numberMode } = await getParams();
    const answer = await setupAnswer(idx, numberMode);
    const hitMax = setupTable(table, answer, min, max, numberMode);


    // Set up the game and wire the table
    game.data = {
        table,
        hitMax,
        answer: numberMode? answer.num : answer.txt,
        telemetry: Settings.exercises.table,
    };

    table.addEventListener("click", game.check);

    if (genially.isViewMode()) {
        game.start();
    }
}

async function setupAnswer(
    idx?: number,
    numberMode: boolean = false
) {

    // Handle if idx is not specified
    const possibleMin = (idx === undefined) || (idx <= 0);
    const min = possibleMin? idx : idx - 1;
    const max = idx;

    // Get one answer
    const answer = random.sampleCategory(Settings.categories.black, {
        minIndex: min,
        maxIndex: max,
    })[0];

    // Get the promt parent group
    const prompt = await Container.search(Settings.html.table);
    if (!prompt)
        throw new Error("Prompt not found");

    const group = genially.getGroup(prompt.element);
    if (!group)
        throw new Error("Group not found");

    // Find and replace the text and image
    const span = group.querySelector("span")!;
    const img  = group.querySelector("img")!;

    img.src = answer.src;

    // Change the text depending if its on number mode
    const text = numberMode? answer.alt : `${answer.num} = ${answer.txt}`
    
    span.textContent = text;

    // Return the answer for further use
    return answer;
}

function setupTable(
    table: HTMLTableElement,
    answer: random.Item,
    min?: number,
    max?: number,
    numberMode = false
) {

    // Count the amount of elements in the table
    const rows = table.rows.length;
    const cols = table.rows[0].cells.length;
    const total = rows * cols;

    // Generate a random amount of hits
    const hitCount = random.biasedInt(0, total, 0, 10);

    const data = random.sampleCategory(Settings.categories.black, {
        count: total,
        include: new Array(hitCount).fill(answer),
        minIndex: min,
        maxIndex: max,
    });

    // Update the table contents
    data.forEach((element, i) => {
        const row = Math.floor(i / cols);
        const cell = i % cols;

        const value = numberMode ? element.num : element.txt;
        table.rows[row].cells[cell].innerText = value;
    });

    return hitCount;
}

async function getParams() {

    // Find the script
    const script = await Container.search(Settings.html.main);
    if (!script)
        throw new Error("Main script not found");

    // Alias the dataset
    const data = script.element.dataset;

    // Parse any parameters from the dataset
    const idx = parseInt(data.index || "");
    const min = parseInt(data.min || "");
    const max = parseInt(data.max || "");
    const numberMode = data.numberMode === "true";

    // Return the parameters
    // Note: NaN values are converted to undefined
    return {
        idx: isNaN(idx) ? undefined : idx,
        min: isNaN(min) ? undefined : min,
        max: isNaN(max) ? undefined : max,
        numberMode,
    };
}