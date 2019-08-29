import { render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import { begin, end } from '@ember/runloop';
import Service from '@ember/service';

import MakeupService from 'ember-makeup/services/makeup';
import { TestContext as _TestContext } from 'ember-test-helpers';

import hbs from 'htmlbars-inline-precompile';

import registerModule from 'dummy/tests/helpers/register-module';

type MakeupServiceInterface = Partial<
  Pick<
    MakeupService,
    Exclude<keyof MakeupService, keyof Evented | keyof EmberObject>
  >
>;

module('Integration | Helper | local-class', function(hooks) {
  setupRenderingTest(hooks);

  interface TestContext extends _TestContext {
    moduleName: string;
    element: _TestContext['element'] & { textContent: string };
  }

  test('it passes through context-less local classes without processing', async function(this: TestContext, assert) {
    this.owner.register(
      'service:makeup',
      class MakeupServiceMock extends Service.extend(Evented)
        implements MakeupServiceInterface {
        contextClassNamePrefix = 'some-class-name-prefix/';

        resolveContext(): string {
          throw new Error('Should not be called');
        }
      }
    );

    this.moduleName = registerModule({ default: { foo: 'bar qux' } });

    await render(hbs`{{local-class 'foo' from=this.moduleName}}`);

    assert.equal(this.element.textContent.trim(), 'bar qux');
  });

  test('it passes through context-less local classes and resolves context classes', async function(this: TestContext, assert) {
    let flavor = 'light';

    this.owner.register(
      'service:makeup',
      class MakeupServiceMock extends Service.extend(Evented)
        implements MakeupServiceInterface {
        contextClassNamePrefix = 'some-class-name-prefix/';

        resolveContext(key: string): string {
          return `context-${flavor}-${key}`;
        }
      }
    );

    this.moduleName = registerModule({
      default: {
        foo: 'bar some-class-name-prefix/baz qux some-class-name-prefix/quax'
      }
    });

    await render(hbs`{{local-class 'foo' from=this.moduleName}}`);

    assert.equal(
      this.element.textContent.trim(),
      'bar context-light-baz qux context-light-quax',
      'resolves context classes'
    );

    flavor = 'dark';
    this.owner.lookup('service:makeup').trigger('theme-change');
    begin();
    end();
    await settled();

    assert.equal(
      this.element.textContent.trim(),
      'bar context-dark-baz qux context-dark-quax',
      'updates on `theme-change` event'
    );
  });
});
