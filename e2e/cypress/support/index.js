// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***********************************************************
// Read more at: https://on.cypress.io/configuration
// ***********************************************************

/* eslint-disable no-loop-func, quote-props */

import '@testing-library/cypress/add-commands';
import 'cypress-wait-until';

import './api';
import './ui_commands';

before(() => {
    // # Login existing sysadmin
    cy.apiAdminLogin().then(({user}) => {
        cy.apiSaveTutorialStep(user.id, '999');
    });

    // # Reset config
    cy.apiUpdateConfig();
});

// Add login cookies to whitelist to preserve it
beforeEach(() => {
    Cypress.Cookies.preserveOnce('MMAUTHTOKEN', 'MMUSERID', 'MMCSRF');
});
