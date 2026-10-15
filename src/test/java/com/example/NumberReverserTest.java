package com.example;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class NumberReverserTest {

    @Test
    public void testReversePositiveNumber() {
        assertEquals(4321, NumberReverser.reverse(1234));
    }

    @Test
    public void testReverseNumberWithZero() {
        assertEquals(21, NumberReverser.reverse(120));
    }

    @Test
    public void testReverseSingleDigit() {
        assertEquals(5, NumberReverser.reverse(5));
    }

    @Test
    public void testReverseNegativeNumber() {
        assertEquals(-321, NumberReverser.reverse(-123));
    }
}