import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;

import static org.junit.Assert.assertTrue;

public class InvenTrackTest {

    private WebDriver driver;

    @Before
    public void setUp() {

        ChromeOptions options = new ChromeOptions();

        // Run Chrome without opening a visible browser window
        options.addArguments("--headless=new");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1920,1080");

        driver = new ChromeDriver(options);

        // Open the actual InvenTrack Products page
        String path = new File("products.html")
                .getAbsoluteFile()
                .toURI()
                .toString();

        driver.get(path);
    }

    @After
    public void tearDown() {

        if (driver != null) {
            driver.quit();
        }
    }

    // TEST CASE 1
    // Add a valid product
    @Test
    public void testAddValidProduct() {

        driver.findElement(By.id("prod-add-btn")).click();

        driver.findElement(By.id("pf-name"))
                .sendKeys("Test Keyboard");

        driver.findElement(By.id("pf-category"))
                .sendKeys("Electronics");

        driver.findElement(By.id("pf-unit"))
                .sendKeys("pcs");

        driver.findElement(By.id("pf-threshold"))
                .sendKeys("10");

        driver.findElement(By.id("pf-save")).click();

        WebElement productTable =
                driver.findElement(By.id("prod-table-body"));

        assertTrue(
                productTable.getText().contains("Test Keyboard")
        );
    }

    // TEST CASE 2
    // Check invalid threshold validation
    @Test
    public void testInvalidThresholdValidation() {

        driver.findElement(By.id("prod-add-btn")).click();

        driver.findElement(By.id("pf-name"))
                .sendKeys("Invalid Product");

        driver.findElement(By.id("pf-category"))
                .sendKeys("Electronics");

        driver.findElement(By.id("pf-unit"))
                .sendKeys("pcs");

        // Invalid value: threshold must be at least 1
        driver.findElement(By.id("pf-threshold"))
                .sendKeys("0");

        driver.findElement(By.id("pf-save")).click();

        WebElement error =
                driver.findElement(By.id("pf-threshold-err"));

        assertTrue(
                error.getText().contains(
                        "Threshold must be at least 1."
                )
        );
    }

    // TEST CASE 3
    // Search for an existing product
    @Test
    public void testProductSearch() {

        driver.findElement(By.id("prod-add-btn")).click();

        driver.findElement(By.id("pf-name"))
                .sendKeys("SearchTestProduct");

        driver.findElement(By.id("pf-category"))
                .sendKeys("Electronics");

        driver.findElement(By.id("pf-unit"))
                .sendKeys("pcs");

        driver.findElement(By.id("pf-threshold"))
                .sendKeys("5");

        driver.findElement(By.id("pf-save")).click();

        driver.findElement(By.id("prod-search"))
                .sendKeys("SearchTestProduct");

        WebElement productTable =
                driver.findElement(By.id("prod-table-body"));

        assertTrue(
                productTable.getText().contains(
                        "SearchTestProduct"
                )
        );
    }

    // TEST CASE 4
    // Check that all important product form fields are displayed
    @Test
    public void testProductFormFields() {

        driver.findElement(By.id("prod-add-btn")).click();

        assertTrue(
                driver.findElement(By.id("pf-name")).isDisplayed()
        );

        assertTrue(
                driver.findElement(By.id("pf-category")).isDisplayed()
        );

        assertTrue(
                driver.findElement(By.id("pf-unit")).isDisplayed()
        );

        assertTrue(
                driver.findElement(By.id("pf-threshold")).isDisplayed()
        );

        assertTrue(
                driver.findElement(By.id("pf-save")).isDisplayed()
        );
    }
}