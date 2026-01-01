import * as dom from "../utils/dom.ts"
import * as random from "../utils/random.ts";
import * as genially from "../utils/genially.ts";

import { Container } from "../core/container.ts";
import { Game } from "../core/game.ts";
import { Settings } from "../settings.ts";
import { game } from "../games/guess.ts";

dom.init();
main();

async function main() {

    // Find the guess elements
    const area   = await Container.search(Settings.html.area);
    const pieces = await Container.searchAll(Settings.html.piece);

    // Set up the data for the exercise
    const answer = await setupAnswer();

    const { verify, holder } = buildArea(area!.element);

    // Set up the game
    game.data = {
        verify,
        holder,
        answer,
        telemetry: Settings.exercises.guess,
    };

    // Wire the pieces to be able be added and removed from area
    pieces.forEach(piece => {
        const group = genially.getGroup(piece.element);
        if (!group) throw new Error("Group not found");

        group.addEventListener("click", event => moveToArea(event, game, holder));
    });

    verify.addEventListener("click", game.check);

    if (genially.isViewMode()) {
        game.start();
    }
}

function moveToArea(event: Event, game: Game, content: HTMLElement) {
    if (game.gameOver) return;
  
    // Prepare to copy any grouped content
    const element = genially.getGroup(event.target as HTMLElement);
    if (!element) throw new Error("Element not found");
  
    // Clone the element and it children, and prevent absolute positioning
    const copy = element.cloneNode(true) as HTMLElement;
    copy.style.position = "relative";
  
    copy.addEventListener("click", () => {
      if (!game.gameOver) copy.remove();
    });
  
    content.appendChild(copy);
};

async function setupAnswer() {

    // Find the marker and climb to the group
    const guess = await Container.search(Settings.html.guess);
    if (!guess)
        throw new Error("Guess not found");

    const group = genially.getGroup(guess.element) as HTMLElement;
    if (!group)
        throw new Error("Group not found");

    // Find all the images
    const images = group.querySelectorAll("img");

    // Get one sample per image
    const samples = random.sampleCategory(Settings.categories.black, {
        count: images.length
    });

    // Replace the images with the samples and merge the corresponding numbers
    let merged = "";
    images.forEach((image, i) => {
        const img = image;
        img.src = samples[i].src;
        merged += samples[i].num;
    });

    return merged;
};

function buildArea(area: HTMLDivElement) {

    // Style the area
    area.style.border = "2px solid black";
    area.style.borderRadius = "12px";
    area.style.height = "100%";
    area.style.width  = "100%";
    area.style.position = "relative";


    // Prepare the <button>
    const verify = document.createElement("button");
    verify.style.position = "absolute";
    verify.style.top = "0";
    verify.style.right = "0";
    verify.style.border = "1px solid black";
    verify.style.borderRadius = "12px";
    verify.style.padding = "10px 20px";
    verify.style.cursor = "pointer";
    verify.style.height = "100%";
    verify.style.width = "15%";
    verify.style.backgroundColor = "#f0f0f0";
    verify.style.transition = "background-color 0.2s ease";
    
    // Add some text to the button
    const text = document.createElement("p");
    text.textContent = "Comprobar";
    text.style.fontSize = "1.3rem";
    text.style.textAlign = "center";
    verify.appendChild(text);


    // Prepare the content holder
    const holder = document.createElement("div");
    holder.style.borderRadius = "12px";
    holder.style.padding = "10px";
    holder.style.display = "flex";
    holder.style.flexDirection = "row";
    holder.style.gap = "10px";
    holder.style.width = "85%";
    holder.style.height = "100%";
    holder.style.overflow = "hidden"
    holder.style.alignItems = "center";

    // Add them to the area and return them
    area.appendChild(verify);
    area.appendChild(holder);

    return { verify, holder };
};