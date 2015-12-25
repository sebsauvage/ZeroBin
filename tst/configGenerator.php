#!/usr/bin/env php
<?php
/**
 * generates a config unit test class
 *
 * This generator is meant to test all possible configuration combinations
 * without having to write endless amounts of code manually.
 *
 * DANGER: Too many options/settings and too high max iteration setting may trigger
 *         a fork bomb. Please save your work before executing this script.
 */

include 'bootstrap.php';

$vrd  = array('view', 'read', 'delete');
$vcud = array('view', 'create', 'read', 'delete');

new configurationTestGenerator(array(
    'main/discussion' => array(
        array(
            'setting' => true,
            'tests' => array(
                array(
                    'conditions' => array('steps' => $vrd),
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'id' => 'opendisc',
                        ),
                        '$content',
                        'outputs enabled discussion correctly'
                    ),
                ), array(
                    'conditions' => array('steps' => array('create'), 'traffic/limit' => 10),
                    'settings' => array('$_POST["opendiscussion"] = "neither 1 nor 0"'),
                    'type' => 'Equals',
                    'args' => array(
                        1,
                        '$response["status"]',
                        'when discussions are enabled, but invalid flag posted, fail to create paste'
                    ),
                ), array(
                    'conditions' => array('steps' => array('create'), 'traffic/limit' => 10),
                    'settings' => array('$_POST["opendiscussion"] = "neither 1 nor 0"'),
                    'type' => 'False',
                    'args' => array(
                        '$this->_model->exists(helper::getPasteId())',
                        'when discussions are enabled, but invalid flag posted, paste is not created'
                    ),
                ),
            ),
            'affects' => $vcud
        ), array(
            'setting' => false,
            'tests' => array(
                array(
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'id' => 'opendisc',
                        ),
                        '$content',
                        'outputs disabled discussion correctly'
                    ),
                ),
            ),
            'affects' => $vrd
        ),
    ),
    'main/opendiscussion' => array(
        array(
            'setting' => true,
            'tests' => array(
                array(
                    'conditions' => array('main/discussion' => true),
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'id' => 'opendiscussion',
                            'attributes' => array(
                                'checked' => 'checked',
                            ),
                        ),
                        '$content',
                        'outputs checked discussion correctly'
                    ),
                ),
            ),
            'affects' => $vrd
        ), array(
            'setting' => false,
            'tests' => array(
                array(
                    'conditions' => array('main/discussion' => true),
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'id' => 'opendiscussion',
                            'attributes' => array(
                                'checked' => 'checked',
                            ),
                        ),
                        '$content',
                        'outputs unchecked discussion correctly'
                    ),
                ),
            ),
            'affects' => $vrd
        ),
    ),
    'main/burnafterreadingselected' => array(
        array(
            'setting' => true,
            'tests' => array(
                array(
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'id' => 'burnafterreading',
                            'attributes' => array(
                                'checked' => 'checked',
                            ),
                        ),
                        '$content',
                        'preselects burn after reading option',
                    ),
                ),
            ),
            'affects' => array('view'),
        ), array(
            'setting' => false,
            'tests' => array(
                array(
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'id' => 'burnafterreading',
                            'attributes' => array(
                                'checked' => 'checked',
                            ),
                        ),
                        '$content',
                        'burn after reading option is unchecked',
                    ),
                ),
            ),
            'affects' => array('view'),
        ),
    ),
    'main/password' => array(
        array(
            'setting' => true,
            'tests' => array(
                array(
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'id' => 'password',
                        ),
                        '$content',
                        'outputs password input correctly'
                    ),
                ),
            ),
            'affects' => $vrd
        ), array(
            'setting' => false,
            'tests' => array(
                array(
                    'conditions' => array('main/discussion' => true),
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'id' => 'password',
                        ),
                        '$content',
                        'removes password input correctly'
                    ),
                ),
            ),
            'affects' => $vrd
        ),
    ),
    'main/template' => array(
        array(
            'setting' => 'page',
            'tests' => array(
                array(
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'tag' => 'link',
                            'attributes' => array(
                                'type' => 'text/css',
                                'rel' => 'stylesheet',
                                'href' => 'regexp:#css/zerobin\.css#',
                            ),
                        ),
                        '$content',
                        'outputs "page" stylesheet correctly',
                    ),
                ), array(
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'tag' => 'link',
                            'attributes' => array(
                                'type' => 'text/css',
                                'rel' => 'stylesheet',
                                'href' => 'regexp:#css/bootstrap/bootstrap-\d[\d\.]+\d\.css#',
                            ),
                        ),
                        '$content',
                        'removes "bootstrap" stylesheet correctly',
                    ),
                ),
            ),
            'affects' => $vrd,
        ), array(
            'setting' => 'bootstrap',
            'tests' => array(
                array(
                    'type' => 'NotTag',
                    'args' => array(
                        array(
                            'tag' => 'link',
                            'attributes' => array(
                                'type' => 'text/css',
                                'rel' => 'stylesheet',
                                'href' => 'regexp:#css/zerobin.css#',
                            ),
                        ),
                        '$content',
                        'removes "page" stylesheet correctly',
                    ),
                ), array(
                    'type' => 'Tag',
                    'args' => array(
                        array(
                            'tag' => 'link',
                            'attributes' => array(
                                'type' => 'text/css',
                                'rel' => 'stylesheet',
                                'href' => 'regexp:#css/bootstrap/bootstrap-\d[\d\.]+\d\.css#',
                            ),
                        ),
                        '$content',
                        'outputs "bootstrap" stylesheet correctly',
                    ),
                ),
            ),
            'affects' => $vrd,
        ),
    ),
    'main/sizelimit' => array(
        array(
            'setting' => 10,
            'tests' => array(
                array(
                    'conditions' => array('steps' => array('create'), 'traffic/limit' => 10),
                    'type' => 'Equals',
                    'args' => array(
                        1,
                        '$response["status"]',
                        'when sizelimit limit exceeded, fail to create paste'
                    ),
                ),
            ),
            'affects' => array('create')
        ), array(
            'setting' => 2097152,
            'tests' => array(
                array(
                    'conditions' => array('steps' => array('create'), 'traffic/limit' => 0, 'main/burnafterreadingselected' => true),
                    'settings' => array('sleep(3)'),
                    'type' => 'Equals',
                    'args' => array(
                        0,
                        '$response["status"]',
                        'when sizelimit limit is not reached, successfully create paste'
                    ),
                ), array(
                    'conditions' => array('steps' => array('create'), 'traffic/limit' => 0, 'main/burnafterreadingselected' => true),
                    'settings' => array('sleep(3)'),
                    'type' => 'True',
                    'args' => array(
                        '$this->_model->exists($response["id"])',
                        'when sizelimit limit is not reached, paste exists after posting data'
                    ),
                ),
            ),
            'affects' => array('create')
        ),
    ),
    'traffic/limit' => array(
        array(
            'setting' => 0,
            'tests' => array(
                array(
                    'conditions' => array('steps' => array('create'), 'main/sizelimit' => 2097152),
                    'type' => 'Equals',
                    'args' => array(
                        0,
                        '$response["status"]',
                        'when traffic limit is disabled, successfully create paste'
                    ),
                ), array(
                    'conditions' => array('steps' => array('create'), 'main/sizelimit' => 2097152),
                    'type' => 'True',
                    'args' => array(
                        '$this->_model->exists($response["id"])',
                        'when traffic limit is disabled, paste exists after posting data'
                    ),
                ),
            ),
            'affects' => array('create')
        ), array(
            'setting' => 10,
            'tests' => array(
                array(
                    'conditions' => array('steps' => array('create')),
                    'type' => 'Equals',
                    'args' => array(
                        1,
                        '$response["status"]',
                        'when traffic limit is on and we do not wait, fail to create paste'
                    ),
                ),
            ),
            'affects' => array('create')
        ), array(
            'setting' => 2,
            'tests' => array(
                array(
                    'conditions' => array('steps' => array('create'), 'main/sizelimit' => 2097152),
                    'settings' => array('sleep(3)'),
                    'type' => 'Equals',
                    'args' => array(
                        0,
                        '$response["status"]',
                        'when traffic limit is on and we wait, successfully create paste'
                    ),
                ), array(
                    'conditions' => array('steps' => array('create'), 'main/sizelimit' => 2097152),
                    'settings' => array('sleep(3)'),
                    'type' => 'True',
                    'args' => array(
                        '$this->_model->exists($response["id"])',
                        'when traffic limit is on and we wait, paste exists after posting data'
                    ),
                ),
            ),
            'affects' => array('create')
        ),
    ),
));

class configurationTestGenerator
{
    /**
     * endless loop protection, since we're working with a recursive function,
     * creating factorial configurations
     * @var int
     */
    const MAX_ITERATIONS = 2000;

    /**
     * options to test
     * @var array
     */
    private $_options;

    /**
     * iteration count to guarantee timely end
     * @var int
     */
    private $_iterationCount = 0;

    /**
     * generated configurations
     * @var array
     */
    private $_configurations = array(
        array('options' => array(), 'tests' => array(), 'affects' => array())
    );

    /**
     * constructor, generates the configuration test
     * @param array $options
     */
    public function __construct($options) {
        $this->_options = $options;
        // generate all possible combinations of options: options^settings
        $this->_generateConfigurations();
        $this->_writeConfigurationTest();
    }

    /**
     * write configuration test file based on generated configuration array
     */
    private function _writeConfigurationTest()
    {
        $defaultOptions = parse_ini_file(CONF, true);
        $code = $this->_getHeader();
        foreach ($this->_configurations as $key => $conf) {
            $fullOptions = array_replace_recursive($defaultOptions, $conf['options']);
            $options = helper::var_export_min($fullOptions, true);
            foreach ($conf['affects'] as $step) {
                $testCode = $preCode = array();
                foreach ($conf['tests'] as $tests) {
                    foreach ($tests[0] as $test) {
                        // skip if test does not affect this step
                        if (!in_array($step, $tests[1])) {
                            continue;
                        }
                        // skip if not all test conditions are met
                        if (array_key_exists('conditions', $test)) {
                            while (list($path, $setting) = each($test['conditions'])) {
                                if ($path == 'steps' && !in_array($step, $setting)) {
                                    continue 2;
                                } elseif($path != 'steps') {
                                    list($section, $option) = explode('/', $path);
                                    if ($fullOptions[$section][$option] !== $setting) {
                                        continue 2;
                                    }
                                }
                            }
                        }
                        if (array_key_exists('settings', $test)) {
                            foreach ($test['settings'] as $setting) {
                                $preCode[$setting] = $setting;
                            }
                        }
                        $args = array();
                        foreach ($test['args'] as $arg) {
                            if (is_string($arg) && strpos($arg, '$') === 0) {
                                $args[] = $arg;
                            } else {
                                $args[] = helper::var_export_min($arg, true);
                            }
                        }
                        $testCode[] = array($test['type'], implode(', ', $args));
                    }
                }
                $code .= $this->_getFunction(
                    ucfirst($step), $key, $options, $preCode, $testCode
                );
            }
        }
        $code .= '}' . PHP_EOL;
        file_put_contents('configurationCombinations.php', $code);
    }

    /**
     * get header of configuration test file
     *
     * @return string
     */
    private function _getHeader()
    {
        return <<<'EOT'
<?php
/**
 * DO NOT EDIT: This file is generated automatically using configGenerator.php
 */
class configurationCombinationsTest extends PHPUnit_Framework_TestCase
{
    private $_model;

    private $_conf;

    public function setUp()
    {
        /* Setup Routine */
        helper::confBackup();

        $this->_model = zerobin_data::getInstance(array('dir' => PATH . 'data'));
        serversalt::setPath(PATH . 'data');
        $this->reset();
    }

    public function tearDown()
    {
        /* Tear Down Routine */
        helper::confRestore();
}

    public function reset($configuration = array())
    {
        $_POST = array();
        $_GET = array();
        $_SERVER = array();
        if ($this->_model->exists(helper::getPasteId()))
            $this->_model->delete(helper::getPasteId());
        helper::createIniFile(CONF, $configuration);
    }


EOT;
    }

    /**
     * get unit tests function block
     *
     * @param string $step
     * @param int $key
     * @param array $options
     * @param array $preCode
     * @param array $testCode
     * @return string
     */
    private function _getFunction($step, $key, &$options, $preCode, $testCode)
    {
        if (count($testCode) == 0) {
            echo "skipping creation of test$step$key, no valid tests found for configuration: $options". PHP_EOL;
            return '';
        }

        $preString = $testString = '';
        foreach ($preCode as $setting) {
            $preString .= "        $setting;" . PHP_EOL;
        }
        foreach ($testCode as $test) {
            $type = $test[0];
            $args = $test[1];
            $testString .= "        \$this->assert$type($args);" . PHP_EOL;
        }
        $code = <<<EOT
    /**
     * @runInSeparateProcess
     */
    public function test$step$key()
    {
        \$this->reset($options);
EOT;

        // step specific initialization
        switch ($step) {
            case 'Create':
                $code .= PHP_EOL . <<<'EOT'
        $_POST = helper::getPaste();
        $_SERVER['HTTP_X_REQUESTED_WITH'] = 'JSONHttpRequest';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_SERVER['REMOTE_ADDR'] = '::1';
EOT;
                break;
            case 'Read':
                $code .= PHP_EOL . <<<'EOT'
        $this->_model->create(helper::getPasteId(), helper::getPaste());
        $_SERVER['QUERY_STRING'] = helper::getPasteId();
EOT;
                break;
            case 'Delete':
                $code .= PHP_EOL . <<<'EOT'
        $this->_model->create(helper::getPasteId(), helper::getPaste());
        $this->assertTrue($this->_model->exists(helper::getPasteId()), 'paste exists before deleting data');
        $_GET['pasteid'] = helper::getPasteId();
        $_GET['deletetoken'] = hash_hmac('sha1', helper::getPasteId(), serversalt::get());
EOT;
                break;
        }

        // all steps
        $code .= PHP_EOL . $preString;
        $code .= <<<'EOT'
        ob_start();
        new zerobin;
        $content = ob_get_contents();
EOT;

        // step specific tests
        switch ($step) {
            case 'Create':
                $code .= <<<'EOT'

        $response = json_decode($content, true);
EOT;
                break;
            case 'Read':
                $code .= <<<'EOT'

        $this->assertTag(
            array(
                'id' => 'cipherdata',
                'content' => htmlspecialchars(helper::getPasteAsJson(), ENT_NOQUOTES)
            ),
            $content,
            'outputs data correctly'
        );
EOT;
                break;
            case 'Delete':
                $code .= <<<'EOT'

        $this->assertTag(
            array(
                'id' => 'status',
                'content' => 'Paste was properly deleted'
            ),
            $content,
            'outputs deleted status correctly'
        );
        $this->assertFalse($this->_model->exists(helper::getPasteId()), 'paste successfully deleted');
EOT;
                break;
        }
        return $code . PHP_EOL . PHP_EOL . $testString . '    }' . PHP_EOL . PHP_EOL;
    }

    /**
     * recursive function to generate configurations based on options
     *
     * @throws Exception
     * @return array
     */
    private function _generateConfigurations()
    {
        // recursive factorial function
        if (++$this->_iterationCount > self::MAX_ITERATIONS) {
            echo 'max iterations reached, stopping', PHP_EOL;
            return $this->_configurations;
        }
        echo "generateConfigurations: iteration $this->_iterationCount", PHP_EOL;
        $continue = list($path, $settings) = each($this->_options);
        if ($continue === false) {
            return $this->_configurations;
        }
        list($section, $option) = explode('/', $path);
        for ($c = 0, $max = count($this->_configurations); $c < $max; ++$c) {
            if (!array_key_exists($section, $this->_configurations[$c]['options'])) {
                $this->_configurations[$c]['options'][$section] = array();
            }
            if (count($settings) == 0) {
                throw new Exception("Check your \$options: option $option has no settings!");
            }
            // set the first setting in the original configuration
            $setting = current($settings);
            $this->_addSetting($this->_configurations[$c], $setting, $section, $option);

            // create clones for each of the other settings
            while ($setting = next($settings)) {
                $clone = $this->_configurations[$c];
                $this->_configurations[] = $this->_addSetting($clone, $setting, $section, $option);
            }
            reset($settings);
        }
        return $this->_generateConfigurations();
    }

    /**
     * add a setting to the given configuration
     *
     * @param array $configuration
     * @param array $setting
     * @param string $section
     * @param string $option
     * @throws Exception
     * @return array
     */
    private function _addSetting(&$configuration, &$setting, &$section, &$option) {
        if (++$this->_iterationCount > self::MAX_ITERATIONS) {
            echo 'max iterations reached, stopping', PHP_EOL;
            return $configuration;
        }
        echo "addSetting: iteration $this->_iterationCount", PHP_EOL;
        if (
            array_key_exists($option, $configuration['options'][$section]) &&
            $configuration['options'][$section][$option] === $setting['setting']
        ) {
            $val = helper::var_export_min($setting['setting'], true);
            throw new Exception("Endless loop or error in options detected: option '$option' already exists with setting '$val' in one of the configurations!");
        }
        $configuration['options'][$section][$option] = $setting['setting'];
        $configuration['tests'][$option] = array($setting['tests'], $setting['affects']);
        foreach ($setting['affects'] as $affects) {
            if (!in_array($affects, $configuration['affects'])) {
                $configuration['affects'][] = $affects;
            }
        }
        return $configuration;
    }
}
