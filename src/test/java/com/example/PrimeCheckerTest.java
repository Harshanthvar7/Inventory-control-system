
package com.example;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

public class PrimeCheckerTest {

    @Test
    public void testPrimeNumber() {
        assertTrue(PrimeChecker.isPrime(7));
    }

    @Test
    public void testEvenPrime() {
        assertTrue(PrimeChecker.isPrime(2));
    }

    @Test
    public void testNotPrime() {
        assertFalse(PrimeChecker.isPrime(3));
    }

    @Test
    public void testOne() {
        assertFalse(PrimeChecker.isPrime(1));
    }

    @Test
    public void testNegativeNumber() {
        assertFalse(PrimeChecker.isPrime(-5));
    }
}
