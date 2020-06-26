// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import merge from 'merge-deep';

import {getRandomId} from '../../utils';
import partialDefaultConfig from '../../utils/partial_default_config.json';

import {getAdminAccount} from '../env';

Cypress.Commands.add('apiLogin', (user) => {
    cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: '/api/v4/users/login',
        method: 'POST',
        body: {login_id: user.username, password: user.password},
    }).then((response) => {
        expect(response.status).to.equal(200);
        return cy.wrap({user: response.body});
    });
});

Cypress.Commands.add('apiAdminLogin', () => {
    const admin = getAdminAccount();

    return cy.apiLogin(admin);
});

Cypress.Commands.add('apiGetMe', () => {
    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: 'api/v4/users/me',
        method: 'GET',
    }).then((response) => {
        expect(response.status).to.equal(200);
        cy.wrap({user: response.body});
    });
});

Cypress.Commands.add('apiGetUserByEmail', (email) => {
    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: '/api/v4/users/email/' + email,
    }).then((response) => {
        expect(response.status).to.equal(200);
        cy.wrap(response);
    });
});

Cypress.Commands.add('apiSaveUserPreference', (preferences = [], userId = 'me') => {
    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: `/api/v4/users/${userId}/preferences`,
        method: 'PUT',
        body: preferences,
    });
});

Cypress.Commands.add('apiCreateTeam', (name, displayName, type = 'O', unique = true) => {
    const randomSuffix = getRandomId();

    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: '/api/v4/teams',
        method: 'POST',
        body: {
            name: unique ? `${name}-${randomSuffix}` : name,
            display_name: unique ? `${displayName} ${randomSuffix}` : displayName,
            type,
        },
    }).then((response) => {
        expect(response.status).to.equal(201);
        cy.wrap({team: response.body});
    });
});

Cypress.Commands.add('apiInstallPluginFromUrl', (pluginDownloadUrl, force = false) => {
    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: `/api/v4/plugins/install_from_url?plugin_download_url=${encodeURIComponent(pluginDownloadUrl)}&force=${force}`,
        method: 'POST',
        timeout: 60000,
    }).then((response) => {
        expect(response.status).to.equal(201);
        return cy.wrap(response);
    });
});

const getDefaultConfig = () => {
    const fromCypressConfig = {
        ServiceSettings: {
            SiteURL: Cypress.config('baseUrl'),
        },
    };

    return merge(partialDefaultConfig, fromCypressConfig);
};

Cypress.Commands.add('apiUpdateConfig', (newSettings = {}) => {
    // # Get current settings
    return cy.request('/api/v4/config').then((response) => {
        const oldSettings = response.body;

        const settings = merge(oldSettings, getDefaultConfig(), newSettings);

        // # Set the modified settings
        return cy.request({
            url: '/api/v4/config',
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            method: 'PUT',
            body: settings,
        }).then((updateResponse) => {
            expect(updateResponse.status).to.equal(200);
            cy.wrap(response);
        });
    });
});

// *****************************************************************************
// Channels
// https://api.mattermost.com/#tag/channels
// *****************************************************************************

Cypress.Commands.add('apiCreateChannel', (teamId, name, displayName, type = 'O', purpose = '', header = '', unique = true) => {
    const randomSuffix = getRandomId();

    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: '/api/v4/channels',
        method: 'POST',
        body: {
            team_id: teamId,
            name: unique ? `${name}-${randomSuffix}` : name,
            display_name: unique ? `${displayName} ${randomSuffix}` : displayName,
            type,
            purpose,
            header,
        },
    }).then((response) => {
        expect(response.status).to.equal(201);
        return cy.wrap({channel: response.body});
    });
});

Cypress.Commands.add('apiAddUserToChannel', (channelId, userId) => {
    return cy.request({
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        url: '/api/v4/channels/' + channelId + '/members',
        method: 'POST',
        body: {
            user_id: userId,
        },
    }).then((response) => {
        expect(response.status).to.equal(201);
        return cy.wrap(response);
    });
});

// *****************************************************************************
// Preferences
// https://api.mattermost.com/#tag/preferences
// *****************************************************************************

Cypress.Commands.add('apiSaveTutorialStep', (userId, value = '999') => {
    const preference = {
        user_id: userId,
        category: 'tutorial_step',
        name: userId,
        value,
    };

    return cy.apiSaveUserPreference([preference], userId);
});

// *****************************************************************************
// Teams
// https://api.mattermost.com/#tag/teams
// *****************************************************************************

Cypress.Commands.add('apiAddUserToTeam', (teamId, userId) => {
    cy.request({
        method: 'POST',
        url: `/api/v4/teams/${teamId}/members`,
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        body: {team_id: teamId, user_id: userId},
        qs: {team_id: teamId},
    }).then((response) => {
        expect(response.status).to.equal(201);
        return cy.wrap(response);
    });
});

// *****************************************************************************
// Users
// https://api.mattermost.com/#tag/users
// *****************************************************************************

function generateRandomUser(prefix = 'user') {
    const randomId = getRandomId();

    return {
        email: `${prefix}${randomId}@sample.mattermost.com`,
        username: `${prefix}${randomId}`,
        password: 'passwd',
        first_name: `First${randomId}`,
        last_name: `Last${randomId}`,
        nickname: `Nickname${randomId}`,
    };
}

Cypress.Commands.add('apiCreateUser', ({prefix = 'user', bypassTutorial = true, user = null} = {}) => {
    const newUser = user || generateRandomUser(prefix);

    const createUserOption = {
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        method: 'POST',
        url: '/api/v4/users',
        body: newUser,
    };

    return cy.request(createUserOption).then((userRes) => {
        expect(userRes.status).to.equal(201);

        const createdUser = userRes.body;

        if (bypassTutorial) {
            cy.apiSaveTutorialStep(createdUser.id, '999');
        }

        return cy.wrap({user: {...createdUser, password: newUser.password}});
    });
});
