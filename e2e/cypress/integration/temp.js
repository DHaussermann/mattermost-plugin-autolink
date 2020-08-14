it.only('List and test', function () {
    //Create RHS Link
    let rhsLinkName = `RHS${getRandomId()}`;
    cy.postMessage(`/autolink add ${rhsLinkName}`);
    cy.postMessage(`/autolink set ${rhsLinkName} Pattern RHS`);
    cy.postMessage(
        `/autolink set ${rhsLinkName} Template [RHS](https://docs.mattermost.com/prcess/traing.html#rhs)`,
    );
    cy.postMessage(`A post with RHS link?`);
    cy.uiWaitUntilMessagePostedIncludes(` A post with  `);
    cy.getLastPost().within(() => {
        cy.get('.theme.markdown__link')
            .should('have.attr', 'href', 'https://docs.mattermost.com/prcess/traing.html#rhs')
            .and('have.text', 'RHS');
    });
    // List onnly RHS
    cy.postMessage(`/autolink list ${rhsLinkName}`);


});