// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import timeouts from '../utils/timeouts';

function waitUntilPermanentPost() {
    cy.get('#postListContent').should('be.visible');
    cy.waitUntil(() => cy.findAllByTestId('postView').last().then((el) => !(el[0].id.includes(':'))));
}

Cypress.Commands.add('getLastPost', () => {
    waitUntilPermanentPost();

    cy.findAllByTestId('postView').last();
});

function postMessageAndWait(textboxSelector, message) {
    cy.get(textboxSelector, {timeout: timeouts.HALF_MIN}).should('be.visible').clear().type(`${message}{enter}`);
    cy.waitUntil(() => {
        return cy.get(textboxSelector).then((el) => {
            return el[0].textContent === '';
        });
    });
}

Cypress.Commands.add('postMessage', (message) => {
    postMessageAndWait('#post_textbox', message);
});
