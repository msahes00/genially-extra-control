import * as dom from "../utils/dom.ts";
import * as random from "../utils/random.ts";
import * as genially from "../utils/genially.ts";
import { Container } from "../core/container.ts";
import { Settings } from "../settings.ts";
import { game } from "../games/spot.ts";

dom.init();
main();

async function main() {

    // Find all the hitboxes and generate the total number of correct ones
    const spots  = await Container.searchAll(Settings.html.spot);
    const hitMax = random.biasedInt(0, spots.length);

    const shuffled = random.shuffle(spots);
    
    // Generate and assign correct items
    random.sampleCategory(Settings.categories.numBlack, { count: hitMax })
        .forEach((item, i) => setupSpot(shuffled[i], true, item.src));
    
    // Generate and assign wrong items
    random.sampleCategory(Settings.categories.numWrong, { count: spots.length - hitMax })
        .forEach((item, i) => setupSpot(shuffled[i + hitMax], false, item.src));

    // Set up the game, wire it and start it
    game.data = {
        hitMax,
        spots,
        marked: 0,
        telemetry: Settings.exercises.spot,
    };

    spots.forEach(s => s.element.addEventListener("click", game.check));

    if (genially.isViewMode()) {
        game.start();
    }
}

function setupSpot(spot: Container, correct: boolean, src: string) {

    const elem = spot.element;
    
    // Prepare the styles for the SVGs and the pointing cursor
    elem.style.position = "relative";
    elem.style.cursor   = "pointer";
    elem.style.width    = "100%";
    elem.style.height   = "100%";

    elem.dataset.correct = `${correct}`;

    // Update the image
    const group = genially.getGroup(elem);
    const image = group?.querySelector("img");
    if (!image)
        throw new Error("Image not found");

    image.src = src;
}