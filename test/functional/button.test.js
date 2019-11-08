const PageObject = require('./page-objects/PageObject.js')
const OptionsPageObject = require('./page-objects/OptionsPageObject.js')

const path = require('path')
const assert = require('assert')

const webExtensionsGeckoDriver = require('webextensions-geckodriver')
const { webdriver, firefox } = webExtensionsGeckoDriver
const { until, By } = webdriver

const manifestPath = path.resolve(path.join(__dirname, '../../src/manifest.json'))

describe('Example WebExtension', function () {
  let geckodriver, helper
  this.timeout(15000)

  before(async () => {
    const webExtension = await webExtensionsGeckoDriver(manifestPath)
    geckodriver = webExtension.geckodriver
    helper = {
      toolbarButton () {
        return geckodriver.wait(until.elementLocated(
          By.id('contaner-proxy_bekh-ivanov_me-browser-action')
        ), 1000)
      }
    }
  })

  it('should have a Toolbar Button', async () => {
    const button = await helper.toolbarButton()
    assert.strictEqual(await button.getAttribute('tooltiptext'), 'Container proxy')
  })

  it('should open extension options if the Toolbar Button is clicked', async () => {
    const button = await helper.toolbarButton()
    await button.click()
    await geckodriver.setContext(firefox.Context.CONTENT)

    let handles
    await geckodriver.wait(async () => {
      handles = await geckodriver.getAllWindowHandles()
      return handles.length === 1
    }, 2000, 'Should have opened a new tab')

    await geckodriver.switchTo().window(handles[0])

    await geckodriver.wait(async () => {
      const currentUrl = await geckodriver.getCurrentUrl()

      return currentUrl.endsWith('options/options.html#!/containers')
    }, 5000, 'Should have loaded options.html')

    const header = await geckodriver.wait(until.elementLocated(
      By.css('.header-text h1')
    ), 1000)

    const text = await header.getText()
    assert.strictEqual(text, 'Container proxy')
  })

  it('should add a proxy', async () => {
    const helper1 = new Helper(geckodriver)

    const options = await helper1.openOptionsPage()

    let proxyList = await options.openProxyList()

    const proxyForm = await proxyList.openAddProxyForm()

    await proxyForm.selectProtocol('socks')
    await proxyForm.typeInServer('localhost')
    await proxyForm.typeInPort(1080)
    await proxyForm.typeInUsername('user')
    await proxyForm.typeInPassword('password')

    await proxyForm.testSettings()

    proxyList = await proxyForm.saveSettings()

    return geckodriver.wait(async () => {
      const row = await geckodriver.wait(until.elementLocated(
        By.css('.proxy-list-item:first-of-type')
      ), 2000)

      const label = row.findElement(By.css('.proxy-name'))

      const text = await label.getText()
      return text === 'localhost:1080'
    }, 1000, 'Should show proxy in the list')
  })

  after(function () {
    geckodriver.quit()
  })
})

class Helper extends PageObject {
  constructor (driver) {
    super(driver)
    this.el = {
      toolbarButton: By.id('contaner-proxy_bekh-ivanov_me-browser-action'),

      proxyList: {
        add: By.css('.proxy-list-actions .button.button--primary')
      },
      proxyForm: {
        protocol: By.css('.ProxyForm__connectionSettings select'),
        server: By.css('.ProxyForm__hostInput input'),
        port: By.css('.ProxyForm__portInput input'),
        username: By.css('.ProxyForm__credentials .input:first-of-type input'),
        password: By.css('.ProxyForm__credentials .input:last-of-type input'),
        testSettings: By.css('button[data-testid=testSettings]'),
        save: By.css('button[data-testid=save]'),
        directTestResult: By.css('[data-testid=directResult]'),
        proxiedTestResult: By.css('[data-testid=proxiedResult]')
      }
    }
  }

  async toolbarButton () {
    await this.driver.setContext(firefox.Context.CHROME)
    return this.waitForElement(
      this.el.toolbarButton
    )
  }

  /**
   * @return {Promise<OptionsPageObject>}
   */
  async openOptionsPage () {
    const button = await this.toolbarButton()
    await button.click()
    await this.driver.setContext(firefox.Context.CONTENT)

    let handles
    await this.driver.wait(async () => {
      handles = await this.driver.getAllWindowHandles()
      return true
    }, 2000, 'Should have opened a new tab')

    await this.driver.switchTo().window(handles[handles.length - 1])

    return OptionsPageObject.create(this.driver)
  }

  async addProxyButton () {
    return this.waitForElement(this.el.proxyList.add)
  }
}
