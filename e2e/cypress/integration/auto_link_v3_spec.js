import users from "../fixtures/users.json";
import {getRandomId} from '../utils/index';

const sysadmin = users.sysadmin;

describe("Test AutoLink", function () {
  let team1;
  let team2;
  let linkName = `jira${getRandomId()}`;
  let ticketrNumber = Date.now() % 10000
  
  


  before(() => {
  
    cy.apiLogin(sysadmin.username, sysadmin.password);
    cy.apiGetUserByEmail(sysadmin.email).then((res) => {
        const userId = res.body.id;
        const preferences = [{
            user_id: userId,
            category: 'tutorial_step',
            name: userId,
            value: '999',
        }];
        
        cy.apiSaveUserPreference(preferences, userId);
    });
  
  
    cy.apiCreateTeam("test-team1", "Test Team1").then((response) => {
      team1 = response.body;
    });

    cy.apiCreateTeam("test-team2", "Test Team2").then((response) => {
      team2 = response.body;
    });

    

    // Istall Plugin using API and enable admin  commands
    cy.apiInstallPluginFromUrl(
      `https://github.com/mattermost/mattermost-plugin-autolink/releases/download/v1.2.0/mattermost-autolink-1.2.0.tar.gz`,
      true
    );
    cy.apiUpdateConfig({
      PluginSettings: {
        PluginStates: { "mattermost-autolink": { Enable: true } },
        Plugins: { "mattermost-autolink": { enableadmincommand: true } },
      },
      PasswordSettings: {
        "MinimumLength": 6,
        "Lowercase": false,
        "Number": false,
        "Uppercase": false,
        "Symbol": false
      },
    });
    cy.apiLogin(sysadmin.username, sysadmin.password);
    cy.visit("/");

    //clear tutorial
    //cy.get("#tutorialSkipLink").click();
    //cy.get("#post_textbox").should("be.visible");
    /*
            if (bypassTutorial === true) {
            const preferences = [{
                user_id: userId,
                category: 'tutorial_step',
                name: userId,
                value: '999',
            }];
    */
  });

  it("Autolink autocomple is working", function () {
    //Ensure autilink slash commands are ebabeled
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type("/a");
    cy.contains("autolink [command]");
    cy.contains('autolink [command]').click() 
  });

  it("Create link", function () {
    // Add a link
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type("/a");
    cy.contains('autolink [command]').click() // correct locator - waiting on bug fix
    cy.get("#post_textbox").type(`add ${linkName}`);
    cy.get("#post_textbox").should("contain", `/autolink add ${linkName}`);
    cy.get("#post_textbox");
    cy.wait(250);
    cy.get("#post_textbox").type("{enter}", { force: true });
    cy.contains(`: ${linkName}`);
  });

  it("Add a template", function () {
    //Add a template
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox")
    .should("be.focused")  
    .type(`/autolink set ${linkName} `+"Template [MM-${{}jira_id{}}](https://mattermost.atlassian.net/browse/MM-${{}jira_id{}}){enter}");
    cy.contains("Template: "); 
    cy.contains("Template:")
      .siblings()
      .then((el) => console.log(el));
    cy.waitUntil(() => {
        return cy.getLastPost().then((el) => {
            return el.find('code');
        });
      })
    cy.wait (250);
    cy.getLastPost().within(() => {
      cy.get("code").should(
        "have.text",
        "[MM-${jira_id}](https://mattermost.atlassian.net/browse/MM-${jira_id})"
      ); 
    });
  });

  it("Add a Pattern", function () {
    // Add a patern
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type(
    `/autolink set ${linkName} Pattern (MM)(-)(?P<jira_id>\\d+){enter}`
    );
    cy.contains("Pattern: ");
    });

  it("Pattern is applied", function () {
    //Pattern is applied
    cy.get("#post_textbox").clear;
    cy.postMessage('MM-1234{enter}');
    cy.getLastPost().within(() => {
      cy.get(".theme.markdown__link")
        .should(
          "have.attr",
          "href",
          "https://mattermost.atlassian.net/browse/MM-1234"
        )
        .and("have.text", "MM-1234");
    });
  });

  it("Add a Scope", function () {
    // Add a scope
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type(
      `/autolink set ${linkName} Scope ${team1.name}{enter}`
    );
    cy.contains("Scope: ");
    cy.contains(`${team1.name}`);
  });

  it("Pattern applied in scope only", function () {
    //pattern applied in Team

    cy.get(`#${team1.name}TeamButton`).click();
    cy.wait(500);
    cy.postMessage('MM-1234{enter}'); 
    cy.getLastPost().within(() => {
      cy.get(".theme.markdown__link")
        .should(
          "have.attr",
          "href",
          "https://mattermost.atlassian.net/browse/MM-1234"
        )
        .and("have.text", "MM-1234");
    });
    //pattern NOT applied in Team
    cy.get(`#${team2.name}TeamButton`)
      .should("have.attr", "href", `/${team2.name}`)
      .click();
    cy.get("#post_textbox").should("be.visible").clear(); //.should should resolve need for wait
    cy.wait(500); 
    cy.postMessage('MM-1234')   
      cy.getLastPost().within(() => {
      cy.get("p").should("have.text", "MM-1234");
    });
    cy.get(`#${team1.name}TeamButton`).click();
    cy.get("#post_textbox")
    .should("be.focused")
    });

  it("Disable link ", function () {
    //Confirm enabled state
    cy.get(`#${team1.name}TeamButton`).click();
    cy.wait(250);
    cy.postMessage("MM-2222{enter}")
    cy.getLastPost().within(() => {
      cy.get(".theme.markdown__link")
        .should(
          "have.attr",
          "href",
          "https://mattermost.atlassian.net/browse/MM-2222"
        )
        .and("have.text", "MM-2222");
    });
    //Disable
    cy.postMessage(`/autolink disable ${linkName}{enter}`);
    cy.wait(1500);
    
    cy.getLastPost().within((el) => {
      console.log('look here');
      console.log(el);  
      cy.get("del").should('have.text',linkName);

    })
    cy.wait(499);
    cy.get("#post_textbox").clear();
    cy.wait(250);
    cy.get("#post_textbox").type("MM-2222{enter}");
    cy.getLastPost().within(() => {
      cy.get("p").should("have.text", "MM-2222");
    });
  });

  it("enable link ", function () {
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type(`/autolink enable ${linkName}{enter}`);
    cy.contains(`: ${linkName}`);
    cy.get("#post_textbox").clear();
    cy.wait(250);
    cy.get("#post_textbox").type("MM-2222{enter}");
    cy.getLastPost().within(() => {
      cy.get(".theme.markdown__link")
        .should(
          "have.attr",
          "href",
          "https://mattermost.atlassian.net/browse/MM-2222"
        )
        .and("have.text", "MM-2222");
    });
  });

  it("Apply patterns on edit false by default", function () {
    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type("NN-5678{enter}");
    cy.wait(1000);
    cy.get("#post_textbox").should("be.focused").type("{uparrow}");
    cy.wait(250);
    cy.get("#edit_textbox")
      .should("be.focused")
      .type("{home}{del}{del}MM{enter}");
    cy.getLastPost().within(() => {
      cy.get("p").should("have.text", "MM-5678");
    });
  });

  it("Apply patterns on edit true", function () {
    // Update config
    cy.apiUpdateConfig({
      PluginSettings: {
        PluginStates: { "mattermost-autolink": { Enable: true } },
        Plugins: {
          "mattermost-autolink": { enableadmincommand: true },
          "mattermost-autolink": { enableonupdate: true },
        },
      },
    });

    cy.apiLogin(sysadmin.username, sysadmin.password);
    cy.visit("/");

    //Ensure pattern is applied on edit

    cy.get("#post_textbox").clear();
    cy.get("#post_textbox").type("NN-5678{enter}");
    cy.wait(1000);
    cy.get("#post_textbox").type("{uparrow}");
    cy.wait(250); 
    cy.get("#edit_textbox").type("{home}{del}{del}MM{enter}");
    cy.getLastPost().within(() => {
      cy.get(".theme.markdown__link")
        .should(
          "have.attr",
          "href",
          "https://mattermost.atlassian.net/browse/MM-5678"
        )
        .and("have.text", "MM-5678");
    });
  });

  it("Non sysadmin can not use slash commands", function () {
    cy.apiUpdateConfig({
        PluginSettings: {
          "MinimumLength": 6,
          "Lowercase": false,
          "Number": false,
          "Uppercase": false,
          "Symbol": false
        },
      });
    
      // Login as newly created user
      cy.apiCreateAndLoginAsNewUser({}, [team1.id, team2.id]);
      cy.visit(`/${team1.name}`)
      // Ensure autolink commands are non functinal
      cy.postMessage('/autolink list {enter}')
      cy.getLastPost().within(() => {
        cy.contains(` commands can only be executed by a system administrator or `);
      });
      cy.postMessage('/autolink add pickles{enter}')
      cy.wait(250);
      cy.getLastPost().within(() => {
        cy.contains(` commands can only be executed by a system administrator or `);
      });
      
  });

  it("User added as plugin admin", function () {
    let newUser;

    cy.apiLogin(sysadmin.username, sysadmin.password);
    cy.apiCreateNewUser({}, [team1.id, team2.id]).then((user) => {
      newUser = user;
    
    cy.apiUpdateConfig({
      PluginSettings: {
        PluginStates: { "mattermost-autolink": { Enable: true } },
        Plugins: {
          "mattermost-autolink": { enableadmincommand: true },
          "mattermost-autolink": { enableonupdate: true },
          "mattermost-autolink": { pluginadmins: newUser.id },
        },
      },
    });
    cy.apiLogin(newUser.username, newUser.password);
    });
    cy.visit(`/${team1.name}`);
    cy.get("#post_textbox").should("be.visible");
    cy.wait(250)
    cy.postMessage('/autolink list {enter}')
    cy.postMessage('{enter}')
    cy.get("#post_textbox").should("be.visible");
    cy.getLastPost().within(() => {
      cy.contains(`: ${linkName}`);
    });
    cy.postMessage(`/autolink disable ${linkName}{enter}`);
    cy.wait(1500);
    
    cy.getLastPost().within((el) => {
      console.log('look here');
      console.log(el);  
      cy.get("del").should('have.text',linkName);     
    })
  });

it('Common links work', function() {  
//ESR Link
let esrLinkName = `ESR${getRandomId()}`;
cy.postMessage(`/autolink add ${esrLinkName}`);    
cy.postMessage(`/autolink set ${esrLinkName} Pattern ESR`);
cy.postMessage(`/autolink set ${esrLinkName} Template [ESR](https://docs.mattermost.com/prcess/traing.html#rhs)`);
cy.postMessage(`A post with ESR link?`);  
cy.getLastPost().within(() => {
    cy.get(".theme.markdown__link")
      .should(
        "have.attr",
        "href",
        "https://docs.mattermost.com/prcess/traing.html#rhs"
      )
      .and("have.text", "ESR");
  });
//GitHub Link
let gitLinkName = `GitHub${getRandomId()}`;
cy.postMessage(`/autolink add ${gitLinkName}`);    
cy.postMessage(`/autolink set ${gitLinkName} `+"Pattern https://github\\.com/mattermost/(?P<repo>.+)/pull/(?P<id>\\d+)");
cy.postMessage(`/autolink set ${gitLinkName} `+"Template [pr-${{}repo{}}-${{}id{}}](https://github.com/mattermost/${{}repo{}}/pull/${{}id{}})");
cy.postMessage(`https://github.com/mattermost/mattermost-server/pull/14756`)
cy.getLastPost().within(() => {
    cy.get(".theme.markdown__link")
      .should(
        "have.attr",
        "href",
        "https://github.com/mattermost/mattermost-server/pull/14756"
      )
      .and("have.text", "pr-mattermost-server-14756");
  });
}); 

it('Mutiple GitHub links', function() {  
cy.postMessage('https://github.com/mattermost/mattermost-webapp/pull/2859 and https://github.com/mattermost/mattermost-webapp/pull/2858')
cy.getLastPost().within(() => {
    cy.get(".theme.markdown__link").eq(0)
      .should(
        "have.attr",
        "href",
        "https://github.com/mattermost/mattermost-webapp/pull/2859"
      )
      .and("have.text", "pr-mattermost-webapp-2859");
  });
  cy.getLastPost().within(() => {
    cy.get(".theme.markdown__link").eq(1)
      .should(
        "have.attr",
        "href",
        "https://github.com/mattermost/mattermost-webapp/pull/2858"
      )
      .and("have.text", "pr-mattermost-webapp-2858"); // Should this behave as a contains rather than equal or statys with 
  });
});   

});



// Dylan list
// 0. Finish User added as plugin admin
// 1. Clean up commented out code and maybe some waits
// 2. Add few tests where autolink makes multiple changes in a post

// 3. Submit PR
//     -- Git Ignore