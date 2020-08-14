// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as timeouts from '../utils/timeouts';

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

/**
 * @see `cy.uiWaitUntilMessagePostedIncludes` at ./ui_commands.d.ts
 */
Cypress.Commands.add('uiWaitUntilMessagePostedIncludes', (message) => {
    const checkFn = () => {
        return cy.getLastPost().then((el) => {
            const postedMessageEl = el.find('.post-message__text')[0];
            return Boolean(postedMessageEl && postedMessageEl.textContent.includes(message));
        });
    };

    // Wait for 5 seconds with 500ms check interval
    const options = {
        timeout: timeouts.FIVE_SEC,
        interval: timeouts.HALF_SEC,
        errorMsg: `Expected "${message}" to be in the last message posted but not found.`,
    };

    return cy.waitUntil(checkFn, options);
});
