import * as dom from "../utils/dom.ts";
import * as random from "../utils/random.ts";
import * as genially from "../utils/genially.ts";
import { Container } from "../core/container.ts";
import { Settings } from "../settings.ts";
import { game } from "../games/spot.ts";

dom.init();
main();

async function main() {

    // Set up the quote for the exercise
    await setupQuote();

    // Set up the date for the exercise
    const answer = await setupAnswer();

    // Find all the hitboxes and shuffle them
    const findys = await Container.searchAll(Settings.html.findy);
    const shuffled = random.shuffle(findys);

    // Set up the correct findy
    setupFindy(shuffled[0], true, undefined, answer.num);

    // Set up the rest as wrong
    const left  = shuffled.length - 1;
    const wrong = random.sampleCategory(Settings.categories.numWrong, {
        count: left
    });

    wrong.forEach((item, i) => {
        setupFindy(shuffled[i + 1], false, undefined, item.num);
    });
    
    // Set up the game parameters
    game.data = {
        hitMax: 1,
        marked: 0,
        spots: shuffled,
        telemetry: Settings.exercises.findy,
    };
    
    // Wire each findy to the game
    findys.forEach(s => s.element.addEventListener("click", game.check));

    if (genially.isViewMode()) {
        game.start();
    }
}

async function setupAnswer() {

    // Get one answer
    const answer = random.sampleCategory(Settings.categories.black)[0];

    // Find the date and climb to the group
    const date = await Container.search(Settings.html.date);
    if (!date)
        throw new Error("Date not found");

    const group = genially.getGroup(date.element);
    if (!group)
        throw new Error("Group not found");

    // Find and replace the text and image
    const img = group.querySelector("img")!;
    img.src = answer.src;

    // Return the answer for further use
    return answer;
}

async function setupQuote() {

    // Get one quote
    const answer = random.sampleCategory(Settings.categories.quote)[0];

    // Find the quote container and climb to the group
    const quote = await Container.search(Settings.html.quote);
    if (!quote)
        throw new Error("Quote not found");

    const group = genially.getGroup(quote.element);
    if (!group)
        throw new Error("Group not found");

    // Find and replace the text and image
    const img = group.querySelector("span")!;
    img.innerText = answer.txt;
}

function setupFindy(findy: Container, correct: boolean, group: string | undefined, txt: string) {

    // Prepare the styles for the SVGs and the pointing cursor
    const elem = findy.element;

    elem.style.position = "relative";
    elem.style.cursor   = "pointer";
    elem.style.width    = "100%";
    elem.style.height   = "100%";

    elem.dataset.correct = `${correct}`;
    elem.dataset.group   = group || "";

    // Update the text
    const top = genially.getGroup(elem);

    // @ts-ignore: Dont ask me why but the text is inside a font tag
    const text = top?.querySelector("font");
    if (!text)
        throw new Error("Text not found");

    text.innerText = txt;
}