document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.querySelector('.card-container');
    const firstCard = cardContainer ? cardContainer.querySelector('.card') : null;

    if (cardContainer && firstCard) {
        const totalCards = 10;

        for (let i = 1; i < totalCards; i++) {
            const clonedCard = firstCard.cloneNode(true);
            cardContainer.appendChild(clonedCard);
        }
    }
});
