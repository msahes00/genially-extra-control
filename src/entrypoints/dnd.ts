import * as dom from "../utils/dom.ts";
import * as random from "../utils/random.ts";
import * as genially from "../utils/genially.ts";
import { Container } from "../core/container.ts";
import { Settings } from "../settings.ts";
import { game } from "../games/dnd.ts";

dom.init();
main();

async function main() {
    const objects = await Container.searchAll(Settings.html.obj);
    const boxes   = await Container.searchAll(Settings.html.box);

    // Ensure a 1 to 1 mapping between objects and boxes
    if (boxes.length !== objects.length)
        throw new Error("Number of objects and boxes do not match")

    // Get the images to use
    const data = random.sampleCategory(Settings.categories.black, {
        count: objects.length,
    });

    // Shuffle the objects and the boxes
    const bshuffled = random.shuffle(boxes);
    const oshuffled = random.shuffle(objects);

    // Setup each object and box and update the contents of both
    for (let i = 0; i < oshuffled.length; i++) {
        const obj = oshuffled[i];
        const box = bshuffled[i];

        const objGroup = setupPair(obj, i);
        const boxGroup = setupPair(box, i);

        const objTxt = objGroup.querySelector("b");
        const boxImg = boxGroup.querySelector("img");
        if (!objTxt || !boxImg)
            throw new Error("Unable to change text or image");

        objTxt.textContent = data[i].num;
        boxImg.src = data[i].src;
    }

    // Set up the game data
    game.data = {
        elems: oshuffled,
        boxes: bshuffled,
        telemetry: Settings.exercises.dnd,
    };

    // Wire the objects to the game
    for (const obj of objects) {
        const wrapper = genially.getGroup(obj.element);
        wrapper?.addEventListener("mouseup", game.check);
    }

    if (genially.isViewMode()) {
        game.start();
    }
}

function setupPair(container: Container, index: number) {

    // Make the containers fit the parent
    container.element.style.width  = "100%";
    container.element.style.height = "100%";

    container.element.dataset.index = index.toString();

    const group = genially.getGroup(container.element);
    if (!group)
        throw new Error("Group not found");

    return group;
}