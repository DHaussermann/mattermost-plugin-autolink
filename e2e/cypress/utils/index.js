// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {v4 as uuidv4} from 'uuid';

/**
 * @param {Number} length - length on random string to return, e.g. 6 (default)
 * @return {String} random string
 */
export function getRandomId(length = 6) {
    const MAX_SUBSTRING_INDEX = 27;

    return uuidv4().replace(/-/g, '').substring(MAX_SUBSTRING_INDEX - length, MAX_SUBSTRING_INDEX);
}
